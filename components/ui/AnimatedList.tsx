'use client'

import { motion } from 'framer-motion'

export function AnimatedBg({ children, className, delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: delay }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
}

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
}

export function AnimatedTbody({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <motion.tbody
            variants={container}
            initial="hidden"
            animate="show"
            className={className}
        >
            {children}
        </motion.tbody>
    )
}

export function AnimatedTr({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <motion.tr
            variants={item}
            className={className}
        >
            {children}
        </motion.tr>
    )
}

export function AnimatedDiv({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className={className}
        >
            {children}
        </motion.div>
    )
}

export function AnimatedItem({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <motion.div
            variants={item}
            className={className}
        >
            {children}
        </motion.div>
    )
}
