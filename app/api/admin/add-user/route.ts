import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import User from '../../../model/UserModel';
import Student from '../../../model/StudentModel';
import Teacher from '../../../model/TeacherModel';
import '../../../models/ClassGroup';
import '../../../models/YearLevel';
import '../../../models/Department';
import bcrypt from 'bcrypt';
import { PipelineStage, Types } from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || '';

export async function GET(request: Request) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const isAdmin = decoded.role === 'admin';
    const isTeacher = decoded.role === 'teacher';

    if (!isAdmin && !isTeacher) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    let teacherDepartmentId: Types.ObjectId | null = null;
    if (isTeacher) {
      const requestingUser = await User.findById(decoded.id).select('teacherId');
      if (!requestingUser || !requestingUser.teacherId) {
        return NextResponse.json({ success: false, message: 'Teacher profile not found' }, { status: 404 });
      }

      const teacherProfile = await Teacher.findById(requestingUser.teacherId).select('departmentId');
      if (!teacherProfile || !teacherProfile.departmentId) {
        return NextResponse.json({ success: false, message: 'Teacher department not found' }, { status: 400 });
      }

      teacherDepartmentId = teacherProfile.departmentId as Types.ObjectId;
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limitParam = parseInt(searchParams.get('limit') || '10', 10);
    const limit = Math.min(Math.max(limitParam, 1), 100);
    const roleParam = searchParams.get('role');
    const statusFilter = searchParams.get('status');
    const departmentParam = searchParams.get('department');
    const yearLevel = searchParams.get('yearLevel');
    const classroom = searchParams.get('classroom');
    const search = searchParams.get('search');

    const matchStage: Record<string, unknown> = {};
    if (isTeacher) {
      matchStage.role = 'student';
    } else if (roleParam) {
      matchStage.role = roleParam;
    }
    if (statusFilter) {
      matchStage.status = statusFilter;
    }

    const pipeline: PipelineStage[] = [];
    if (Object.keys(matchStage).length) {
      pipeline.push({ $match: matchStage });
    }

    pipeline.push(
      {
        $lookup: {
          from: 'students',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student',
        },
      },
      {
        $unwind: {
          path: '$student',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'classgroups',
          localField: 'student.classGroupId',
          foreignField: '_id',
          as: 'classGroup',
        },
      },
      {
        $unwind: {
          path: '$classGroup',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'yearlevels',
          localField: 'classGroup.yearLevelId',
          foreignField: '_id',
          as: 'yearLevel',
        },
      },
      {
        $unwind: {
          path: '$yearLevel',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'departments',
          localField: 'classGroup.departmentId',
          foreignField: '_id',
          as: 'studentDepartment',
        },
      },
      {
        $unwind: {
          path: '$studentDepartment',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'teachers',
          localField: 'teacherId',
          foreignField: '_id',
          as: 'teacher',
        },
      },
      {
        $unwind: {
          path: '$teacher',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'departments',
          localField: 'teacher.departmentId',
          foreignField: '_id',
          as: 'teacherDepartment',
        },
      },
      {
        $unwind: {
          path: '$teacherDepartment',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          displayName: {
            $switch: {
              branches: [
                {
                  case: { $eq: ['$role', 'student'] },
                  then: {
                    $trim: {
                      input: {
                        $concat: [
                          { $ifNull: ['$student.firstName', ''] },
                          ' ',
                          { $ifNull: ['$student.lastName', ''] },
                        ],
                      },
                    },
                  },
                },
                {
                  case: { $eq: ['$role', 'teacher'] },
                  then: {
                    $trim: {
                      input: {
                        $concat: [
                          { $ifNull: ['$teacher.firstName', ''] },
                          ' ',
                          { $ifNull: ['$teacher.lastName', ''] },
                        ],
                      },
                    },
                  },
                },
              ],
              default: '$username',
            },
          },
          code: {
            $switch: {
              branches: [
                { case: { $eq: ['$role', 'student'] }, then: { $ifNull: ['$student.studentCode', ''] } },
                { case: { $eq: ['$role', 'teacher'] }, then: { $ifNull: ['$teacher.teacherCode', ''] } },
              ],
              default: '',
            },
          },
          departmentName: {
            $cond: [
              { $eq: ['$role', 'teacher'] },
              '$teacherDepartment.name',
              '$studentDepartment.name',
            ],
          },
          classroomName: '$classGroup.name',
          yearLevelName: '$yearLevel.levelName',
        },
      },
    );

    const filterStage: Record<string, unknown> = {};
    if (yearLevel) {
      filterStage.yearLevelName = yearLevel;
    }
    if (classroom) {
      filterStage.classroomName = classroom;
    }

    if (Object.keys(filterStage).length) {
      pipeline.push({ $match: filterStage });
    }

    let departmentObjectId: Types.ObjectId | null = null;
    if (isTeacher) {
      departmentObjectId = teacherDepartmentId;
    } else if (departmentParam && Types.ObjectId.isValid(departmentParam)) {
      departmentObjectId = new Types.ObjectId(departmentParam);
    }

    if (departmentObjectId) {
      pipeline.push({
        $match: {
          $expr: {
            $or: [
              {
                $and: [
                  { $eq: ['$role', 'teacher'] },
                  { $eq: ['$teacherDepartment._id', departmentObjectId] },
                ],
              },
              {
                $and: [
                  { $eq: ['$role', 'student'] },
                  { $eq: ['$classGroup.departmentId', departmentObjectId] },
                ],
              },
            ],
          },
        },
      });
    }

    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(safeSearch, 'i');
      pipeline.push({
        $match: {
          $or: [
            { displayName: regex },
            { code: regex },
          ],
        },
      });
    }

    pipeline.push({
      $project: {
        _id: 1,
        username: '$username',
        displayName: '$displayName',
        firstName: {
          $switch: {
            branches: [
              { case: { $eq: ['$role', 'student'] }, then: { $ifNull: ['$student.firstName', ''] } },
              { case: { $eq: ['$role', 'teacher'] }, then: { $ifNull: ['$teacher.firstName', ''] } },
            ],
            default: '$username',
          },
        },
        lastName: {
          $switch: {
            branches: [
              { case: { $eq: ['$role', 'student'] }, then: { $ifNull: ['$student.lastName', ''] } },
              { case: { $eq: ['$role', 'teacher'] }, then: { $ifNull: ['$teacher.lastName', ''] } },
            ],
            default: '',
          },
        },
        role: 1,
        code: '$code',
        classroom: '$classroomName',
        department: '$departmentName',
        yearLevel: '$yearLevelName',
        status: '$status',
        max_hours_per_week: {
          $cond: [
            { $eq: ['$role', 'teacher'] },
            { $ifNull: ['$teacher.max_hours_per_week', null] },
            null,
          ],
        },
        teacherId: {
          $cond: [
            { $eq: ['$role', 'teacher'] },
            { $toString: '$teacher._id' },
            null,
          ],
        },
      },
    });

    const skip = (page - 1) * limit;
    pipeline.push({
      $facet: {
        data: [
          { $sort: { code: 1, username: 1 } },
          { $skip: skip },
          { $limit: limit },
        ],
        totalCount: [
          { $count: 'count' },
        ],
      },
    });

    const aggregationResult = await User.aggregate(pipeline);
    const result = aggregationResult[0] || { data: [], totalCount: [] };
    const totalItems = result.totalCount[0]?.count || 0;
    const totalPages = Math.max(Math.ceil(totalItems / limit), 1);

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    return NextResponse.json({
      success: false,
      message: 'Internal Server Error',
    }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'User ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { username, password, role, status, ...profileData } = body;

    const userToUpdate = await User.findById(id);
    if (!userToUpdate) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    if (username && username !== userToUpdate.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return NextResponse.json({ success: false, message: 'Username already exists' }, { status: 400 });
      }
      userToUpdate.username = username;
    }

    if (password) {
      userToUpdate.passwordHash = await bcrypt.hash(password, 10);
    }

    if (status) {
      userToUpdate.status = status;
    }

    if (userToUpdate.role === 'student' && userToUpdate.studentId) {
      const { studentCode, firstName, lastName, classGroupId } = profileData;
      await Student.findByIdAndUpdate(userToUpdate.studentId, {
        studentCode,
        firstName,
        lastName,
        classGroupId,
      }, { omitUndefined: true });
    }

    if (userToUpdate.role === 'teacher' && userToUpdate.teacherId) {
      const { teacherCode, firstName, lastName, departmentId, max_hours_per_week } = profileData;
      await Teacher.findByIdAndUpdate(
        userToUpdate.teacherId,
        {
          teacherCode,
          firstName,
          lastName,
          departmentId,
          max_hours_per_week,
        },
        { omitUndefined: true },
      );
    }

    await userToUpdate.save();

    return NextResponse.json({
      success: true,
      data: {
        _id: userToUpdate._id,
        username: userToUpdate.username,
        role: userToUpdate.role,
        status: userToUpdate.status,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        departmentId: profileData.departmentId,
        max_hours_per_week: profileData.max_hours_per_week,
      },
    });

  } catch (err) {
    console.error('Error updating user:', err);
    if (err instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }
    return NextResponse.json({
      success: false,
      message: 'Internal Server Error',
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'User ID is required' }, { status: 400 });
    }

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Soft delete by changing status
    user.status = 'inactive';
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'User soft deleted successfully',
    });

  } catch (err) {
    console.error('Error deleting user:', err);
    if (err instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }
    return NextResponse.json({
      success: false,
      message: 'Internal Server Error',
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { username, password, role } = body;

    if (!username || !password || !role) {
      return NextResponse.json({
        success: false,
        message: 'username, password, and role are required',
      }, { status: 400 });
    }

    if (!['admin', 'student', 'teacher'].includes(role)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid role',
      }, { status: 400 });
    }

    const existUser = await User.findOne({ username });
    if (existUser) {
      return NextResponse.json({
        success: false,
        message: 'Username already exists',
      }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let studentId = null;
    let teacherId = null;

    if (role === 'student') {
      const { StudentCode , firstName, lastName, classGroupId } = body;

      if ( !firstName || !lastName || !classGroupId) {
        return NextResponse.json({
          success: false,
          message: 'Student info missing',
        }, { status: 400 });
      }
      
      const createdStudent = await Student.create({
        StudentCode,
        firstName,
        lastName,
        classGroupId,
      });
      studentId = createdStudent._id;
    }

    if (role === 'teacher') {
      const { teacherCode , firstName, lastName, departmentId, max_hours_per_week } = body;

      if (!departmentId) {
        return NextResponse.json({
          success: false,
          message: 'Teacher info missing',
        }, { status: 400 });
      }

      const createdTeacher = await Teacher.create({
        teacherCode,
        firstName,
        departmentId,
        max_hours_per_week,
      });

      teacherId = createdTeacher._id;
    }

    const newUser = await User.create({
      username,
      passwordHash,
      role,
      studentId,
      teacherId,
    });

    return NextResponse.json({
      success: true,
      data: newUser,
    });

  } catch (err) {
    console.error('Error creating user:', err);
    return NextResponse.json({
      success: false,
      message: 'Internal Server Error',
    }, { status: 500 });
  }
}
