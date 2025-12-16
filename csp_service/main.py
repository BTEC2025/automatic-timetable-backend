from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

from fastapi import FastAPI
from ortools.sat.python import cp_model
from pydantic import BaseModel, Field

app = FastAPI()



class Teacher(BaseModel):
    teacher_id: str
    teacher_name: str
    department: Optional[str] = None
    role: Optional[str] = "teacher"
    unavailable_slots: List[str] = Field(default_factory=list)


class Subject(BaseModel):
    subject_id: str
    subject_name: str
    theory: int = 0
    practice: int = 0
    credit: Optional[int] = None
    teacher_id: Optional[str] = None


class StudentGroup(BaseModel):
    group_id: str
    group_name: str
    subject_ids: List[str] = Field(default_factory=list)
    department: Optional[str] = None
    yearlevel: Optional[str] = None


class Room(BaseModel):
    room_id: str
    room_name: str
    building: Optional[str] = None
    room_type: Optional[str] = None


class TimeSlot(BaseModel):
    timeslot_id: str
    day: Optional[str] = None
    slot_number: Optional[int] = None
    period: Optional[str] = None
    start: Optional[str] = None
    end: Optional[str] = None


class ConstraintModel(BaseModel):
    id: str
    targetType: str
    targetId: Optional[str] = None
    ruleType: str
    payload: Dict[str, Any] = Field(default_factory=dict)
    priority: str = "hard"


class ScheduleRequest(BaseModel):
    teachers: List[Teacher]
    subjects: List[Subject]
    student_groups: List[StudentGroup]
    rooms: List[Room]
    timeslots: List[TimeSlot]
    constraints: List[ConstraintModel] = Field(default_factory=list)


@dataclass
class SessionDef:
    id: str
    group_id: str
    subject_id: str
    teacher_id: Optional[str]
    ordinal: int


# ---------- Helpers ----------


def _normalize_day(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    normalized = value.strip().title()
    if len(normalized) > 3:
        normalized = normalized[:3]
    return normalized


def _build_slot_lookup(timeslots: List[TimeSlot]) -> Tuple[Dict[str, int], Dict[Tuple[str, int], int], Dict[int, str]]:
    slot_index: Dict[str, int] = {}
    day_period_lookup: Dict[Tuple[str, int], int] = {}
    index_to_slot_id: Dict[int, str] = {}
    for idx, slot in enumerate(timeslots):
        slot_index[slot.timeslot_id] = idx
        index_to_slot_id[idx] = slot.timeslot_id
        day = slot.day
        period = slot.slot_number
        if period is None and slot.period is not None:
            try:
                period = int(slot.period)
            except (TypeError, ValueError):
                period = None
        if (day is None or period is None) and "-" in slot.timeslot_id:
            try:
                day_part, period_part = slot.timeslot_id.split("-", 1)
                day = day or day_part
                if period is None:
                    period = int(period_part)
            except (ValueError, TypeError):
                day = day or None
                period = period or None
        day = _normalize_day(day)
        if day is not None and period is not None:
            day_period_lookup[(day, period)] = idx
    return slot_index, day_period_lookup, index_to_slot_id


def _parse_slot_ids(
    payload: Dict[str, Any],
    slot_index: Dict[str, int],
    day_period_lookup: Dict[Tuple[str, int], int],
    index_to_slot_id: Dict[int, str],
) -> List[str]:
    result: List[str] = []
    slot_values = payload.get("slots")
    if isinstance(slot_values, list):
        for slot_id in slot_values:
            if isinstance(slot_id, str) and slot_id in slot_index:
                result.append(slot_id)
    slot_value = payload.get("slot")
    if isinstance(slot_value, str) and slot_value in slot_index:
        result.append(slot_value)
    day_value = payload.get("day") or payload.get("Day")
    periods_value = payload.get("periods") or payload.get("period")
    days_value = payload.get("days")
    combined_days: List[str] = []
    if isinstance(day_value, str):
        combined_days.append(day_value)
    if isinstance(days_value, list):
        combined_days.extend(str(item) for item in days_value if isinstance(item, (str, int)))
    period_list: List[int] = []
    if isinstance(periods_value, list):
        for item in periods_value:
            try:
                period_list.append(int(item))
            except (TypeError, ValueError):
                continue
    elif isinstance(periods_value, (int, str)):
        try:
            period_list.append(int(periods_value))
        except (TypeError, ValueError):
            pass
    for day in combined_days:
        normalized_day = _normalize_day(str(day))
        for period in period_list:
            lookup_key = (normalized_day, period)
            slot_idx = day_period_lookup.get(lookup_key)
            if slot_idx is not None:
                slot_id = index_to_slot_id.get(slot_idx)
                if slot_id:
                    result.append(slot_id)
    return list(dict.fromkeys(result))


def _filter_sessions_by_subject(payload: Dict[str, Any], candidate_indices: List[int], sessions: List[SessionDef]) -> List[int]:
    subject_ids: List[str] = []
    subject_value = payload.get("subjectId")
    if isinstance(subject_value, str):
        subject_ids.append(subject_value)
    subject_list = payload.get("subjectIds")
    if isinstance(subject_list, list):
        for entry in subject_list:
            if isinstance(entry, str):
                subject_ids.append(entry)
    if not subject_ids:
        return candidate_indices
    subject_set = set(subject_ids)
    return [idx for idx in candidate_indices if sessions[idx].subject_id in subject_set]


def _sessions_for_constraint(
    constraint: ConstraintModel, sessions: List[SessionDef], group_map: Dict[str, StudentGroup]
) -> List[int]:
    if constraint.targetType == "global":
        return list(range(len(sessions)))
    if not constraint.targetId:
        return []
    target_id = constraint.targetId
    target_indices: List[int] = []
    if constraint.targetType == "teacher":
        target_indices = [idx for idx, session in enumerate(sessions) if session.teacher_id == target_id]
    elif constraint.targetType in {"classGroup", "studentGroup"}:
        target_indices = [idx for idx, session in enumerate(sessions) if session.group_id == target_id]
    elif constraint.targetType == "department":
        for idx, session in enumerate(sessions):
            group = group_map.get(session.group_id)
            if group and group.department == target_id:
                target_indices.append(idx)
    elif constraint.targetType in {"yearLevel", "yearlevel"}:
        for idx, session in enumerate(sessions):
            group = group_map.get(session.group_id)
            if group and group.yearlevel == target_id:
                target_indices.append(idx)
    return target_indices


# ---------- API ----------


@app.post("/solve")
def solve_schedule(req: ScheduleRequest):
    if not req.student_groups:
        return {"success": False, "message": "No student groups provided"}
    if not req.subjects:
        return {"success": False, "message": "No subjects provided"}
    if not req.rooms:
        return {"success": False, "message": "At least one room is required"}
    if not req.timeslots:
        return {"success": False, "message": "At least one timeslot is required"}

    subject_map = {subject.subject_id: subject for subject in req.subjects}
    group_map = {group.group_id: group for group in req.student_groups}
    room_ids = [room.room_id for room in req.rooms]
    slot_index, day_period_lookup, index_to_slot_id = _build_slot_lookup(req.timeslots)
    room_index = {room_id: idx for idx, room_id in enumerate(room_ids)}

    sessions: List[SessionDef] = []
    for group in req.student_groups:
        for subject_id in group.subject_ids:
            subject = subject_map.get(subject_id)
            if not subject:
                continue
            periods = (subject.theory or 0) + (subject.practice or 0)
            if periods <= 0:
                periods = 1
            for ordinal in range(periods):
                sessions.append(
                    SessionDef(
                        id=f"{group.group_id}:{subject_id}:{ordinal}",
                        group_id=group.group_id,
                        subject_id=subject_id,
                        teacher_id=subject.teacher_id,
                        ordinal=ordinal,
                    )
                )

    if not sessions:
        return {"success": False, "message": "No schedulable sessions generated"}

    model = cp_model.CpModel()
    assignment_vars: Dict[Tuple[int, int, int], cp_model.IntVar] = {}
    slot_presence: Dict[Tuple[int, int], cp_model.IntVar] = {}

    for session_idx in range(len(sessions)):
        choices: List[cp_model.IntVar] = []
        for slot_id, slot_idx in slot_index.items():
            for room_idx in range(len(room_ids)):
                var = model.NewBoolVar(f"s{session_idx}_t{slot_idx}_r{room_idx}")
                assignment_vars[(session_idx, slot_idx, room_idx)] = var
                choices.append(var)
        if not choices:
            return {"success": False, "message": f"No scheduling choices available for session {sessions[session_idx].id}"}
        model.Add(sum(choices) == 1)

    for session_idx in range(len(sessions)):
        for slot_id, slot_idx in slot_index.items():
            sum_expr = sum(
                assignment_vars[(session_idx, slot_idx, room_idx)]
                for room_idx in range(len(room_ids))
            )
            presence_var = model.NewBoolVar(f"s{session_idx}_slot{slot_idx}")
            model.Add(sum_expr == presence_var)
            slot_presence[(session_idx, slot_idx)] = presence_var

    teacher_sessions: Dict[str, List[int]] = {}
    group_sessions: Dict[str, List[int]] = {}
    for idx, session in enumerate(sessions):
        if session.teacher_id:
            teacher_sessions.setdefault(session.teacher_id, []).append(idx)
        group_sessions.setdefault(session.group_id, []).append(idx)

    for teacher_id, session_indices in teacher_sessions.items():
        for slot_idx in slot_index.values():
            model.Add(
                sum(
                    assignment_vars[(session_idx, slot_idx, room_idx)]
                    for session_idx in session_indices
                    for room_idx in range(len(room_ids))
                )
                <= 1
            )

    for group_id, session_indices in group_sessions.items():
        for slot_idx in slot_index.values():
            model.Add(
                sum(
                    assignment_vars[(session_idx, slot_idx, room_idx)]
                    for session_idx in session_indices
                    for room_idx in range(len(room_ids))
                )
                <= 1
            )

    for room_idx in range(len(room_ids)):
        for slot_idx in slot_index.values():
            model.Add(
                sum(
                    assignment_vars[(session_idx, slot_idx, room_idx)]
                    for session_idx in range(len(sessions))
                )
                <= 1
            )

    # Hard teacher unavailability coming from preprocessed data
    for teacher in req.teachers:
        session_indices = teacher_sessions.get(teacher.teacher_id, [])
        if not session_indices:
            continue
        forbidden_slots = [slot for slot in teacher.unavailable_slots if slot in slot_index]
        for slot_id in forbidden_slots:
            slot_idx = slot_index[slot_id]
            for session_idx in session_indices:
                for room_idx in range(len(room_ids)):
                    model.Add(assignment_vars[(session_idx, slot_idx, room_idx)] == 0)

    soft_penalties: List[Tuple[cp_model.IntVar, int, str, str]] = []

    def register_soft_penalty(var: cp_model.IntVar, weight: int, constraint_id: str, description: str):
        soft_penalties.append((var, weight, constraint_id, description))

    for constraint in req.constraints:
        slots = _parse_slot_ids(constraint.payload, slot_index, day_period_lookup, index_to_slot_id)
        if constraint.ruleType in {"UNAVAILABLE", "BLOCKED_SLOT"}:
            if constraint.targetType == "room":
                if not constraint.targetId:
                    continue
                room_idx = room_index.get(constraint.targetId)
                if room_idx is None:
                    continue
                for slot_id in slots:
                    if slot_id not in slot_index:
                        continue
                    slot_idx = slot_index[slot_id]
                    for session_idx in range(len(sessions)):
                        var = assignment_vars[(session_idx, slot_idx, room_idx)]
                        if constraint.priority == "hard":
                            model.Add(var == 0)
                        else:
                            penalty_var = model.NewBoolVar(f"soft_room_block_{constraint.id}_{slot_idx}_{room_idx}")
                            model.Add(var <= penalty_var)
                            register_soft_penalty(
                                penalty_var,
                                5,
                                constraint.id,
                                f"Room {constraint.targetId} blocked at {slot_id}",
                            )
            else:
                session_indices = _sessions_for_constraint(constraint, sessions, group_map)
                session_indices = _filter_sessions_by_subject(constraint.payload, session_indices, sessions)
                for slot_id in slots:
                    if slot_id not in slot_index:
                        continue
                    slot_idx = slot_index[slot_id]
                    for session_idx in session_indices:
                        if constraint.priority == "hard":
                            for room_idx in range(len(room_ids)):
                                model.Add(assignment_vars[(session_idx, slot_idx, room_idx)] == 0)
                        else:
                            penalty_var = model.NewBoolVar(f"soft_block_{constraint.id}_{session_idx}_{slot_idx}")
                            model.Add(slot_presence[(session_idx, slot_idx)] <= penalty_var)
                            register_soft_penalty(
                                penalty_var,
                                5,
                                constraint.id,
                                f"Session {sessions[session_idx].id} scheduled in discouraged slot {slot_id}",
                            )
        elif constraint.ruleType == "REQUIRED_SLOT":
            session_indices = _sessions_for_constraint(constraint, sessions, group_map)
            session_indices = _filter_sessions_by_subject(constraint.payload, session_indices, sessions)
            for slot_id in slots:
                if slot_id not in slot_index:
                    continue
                slot_idx = slot_index[slot_id]
                literals = [slot_presence[(session_idx, slot_idx)] for session_idx in session_indices]
                if not literals:
                    continue
                if constraint.priority == "hard":
                    model.Add(sum(literals) >= 1)
                else:
                    penalty_var = model.NewBoolVar(f"soft_required_{constraint.id}_{slot_idx}")
                    model.Add(sum(literals) >= 1).OnlyEnforceIf(penalty_var.Not())
                    model.Add(sum(literals) == 0).OnlyEnforceIf(penalty_var)
                    register_soft_penalty(
                        penalty_var,
                        10,
                        constraint.id,
                        f"Requirement for slot {slot_id} not satisfied",
                    )

    if soft_penalties:
        model.Minimize(sum(weight * var for var, weight, _, _ in soft_penalties))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 15
    solver.parameters.num_search_workers = 8
    status = solver.Solve(model)

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return {
            "success": False,
            "message": "No feasible schedule found",
            "status": solver.StatusName(status),
        }

    assignments = []
    for session_idx, session in enumerate(sessions):
        for slot_id, slot_idx in slot_index.items():
            for room_idx, room_id in enumerate(room_ids):
                var = assignment_vars[(session_idx, slot_idx, room_idx)]
                if solver.Value(var) == 1:
                    assignments.append(
                        {
                            "session_id": session.id,
                            "group_id": session.group_id,
                            "subject_id": session.subject_id,
                            "teacher_id": session.teacher_id,
                            "room_id": room_id,
                            "timeslot_id": req.timeslots[slot_idx].timeslot_id,
                        }
                    )

    violation_report = [
        {
            "constraint_id": constraint_id,
            "description": description,
        }
        for var, _weight, constraint_id, description in soft_penalties
        if solver.Value(var) == 1
    ]

    return {
        "success": True,
        "status": solver.StatusName(status),
        "assignments": assignments,
        "stats": {
            "sessions": len(sessions),
            "teachers": len(req.teachers),
            "rooms": len(req.rooms),
            "timeslots": len(req.timeslots),
        },
        "soft_constraint_violations": violation_report,
    }
