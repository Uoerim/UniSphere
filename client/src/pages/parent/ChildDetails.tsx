import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    ChevronLeftIcon,
    BookOpenIcon,
    ChartIcon,
    MailIcon,
    CalendarIcon,
    UserIcon
} from '../../components/ui/Icons';
import styles from './ChildDetails.module.css';

interface Course {
    id: string;
    name: string;
    code: string;
    schedule?: string;
    instructor?: string;
}

interface ChildData {
    id: string;
    entityId: string;
    firstName: string;
    lastName: string;
    name: string;
    email: string;
    grade: string;
    dateOfBirth?: string;
    phone?: string;
    address?: string;
    avatar: string;
    gpa?: string | number | null;
    courses: Course[];
    courseCount: number;
}

// Attempt to render schedules in a friendlier, title-cased form
const formatSchedule = (schedule?: string) => {
    if (!schedule) return '';

    // Try to parse JSON schedules like { day: 'mon', start: '09:00', end: '10:30' }
    try {
        const parsed = JSON.parse(schedule);
        if (Array.isArray(parsed)) {
            return parsed
                .map(part => typeof part === 'string' ? part : `${part.day || ''} ${part.start || ''}-${part.end || ''}`.trim())
                .filter(Boolean)
                .map(p => toTitleCase(p))
                .join(' • ');
        }
        if (parsed && typeof parsed === 'object' && parsed.day && parsed.start && parsed.end) {
            return `${toTitleCase(String(parsed.day))} ${parsed.start} - ${parsed.end}`;
        }
    } catch (e) {
        // Not JSON, fall through to string formatting
    }

    // Fallback: split on commas/semicolons, replace underscores, and title-case words
    const parts = schedule
        .split(/[,;]+/)
        .map(p => p.trim())
        .filter(Boolean)
        .map(p => toTitleCase(p.replace(/_/g, ' ')));

    return parts.join(' • ') || schedule;
};

const toTitleCase = (value: string) =>
    value.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1));

export default function ChildDetails() {
    const { childId } = useParams();
    const { token } = useAuth();
    const navigate = useNavigate();
    const [child, setChild] = useState<ChildData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (childId) {
            fetchChildDetails();
        }
    }, [childId]);

    const fetchChildDetails = async () => {
        try {
            setIsLoading(true);
            setError('');

            const response = await fetch(`http://localhost:4000/api/parents/me/children/${childId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch child details');
            }

            const data = await response.json();
            setChild(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load child details');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading child details...</p>
                </div>
            </div>
        );
    }

    if (error || !child) {
        return (
            <div className={styles.container}>
                <button className={styles.backButton} onClick={() => navigate('/children')}>
                    <ChevronLeftIcon size={18} />
                    Back to My Children
                </button>
                <div className={styles.error}>
                    <p>{error || 'Child not found'}</p>
                    <button className={styles.retryBtn} onClick={fetchChildDetails}>
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Back Button */}
            <button className={styles.backButton} onClick={() => navigate('/children')}>
                <ChevronLeftIcon size={18} />
                Back to My Children
            </button>

            {/* Child Header */}
            <div className={styles.childHeader}>
                <div className={styles.avatar}>{child.avatar}</div>
                <div className={styles.childInfo}>
                    <h1 className={styles.childName}>{child.name}</h1>
                    <div className={styles.childMeta}>
                        {child.grade && <span><UserIcon size={16} /> {child.grade}</span>}
                        {child.email && <span><MailIcon size={16} /> {child.email}</span>}
                        {child.dateOfBirth && <span><CalendarIcon size={16} /> {child.dateOfBirth}</span>}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.primary}`}>
                        <BookOpenIcon size={24} />
                    </div>
                    <div className={styles.statInfo}>
                        <h4>{child.courseCount}</h4>
                        <p>Enrolled Courses</p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.info}`}>
                        <ChartIcon size={24} />
                    </div>
                    <div className={styles.statInfo}>
                        <h4>{child.gpa ?? '--'}</h4>
                        <p>Current GPA</p>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className={styles.mainGrid}>
                {/* Enrolled Courses */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>
                            <BookOpenIcon size={20} />
                            Enrolled Courses
                        </h3>
                        <button
                            className={styles.viewAllBtn}
                            onClick={() => navigate(`/parent-grades${childId ? `?childId=${childId}` : ''}`)}
                        >
                            View All
                        </button>
                    </div>

                    {child.courses.length > 0 ? (
                        <div className={styles.courseList} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                            {child.courses.map((course) => (
                                <div key={course.id} className={styles.courseItem}>
                                    <div className={styles.courseIcon}>
                                        <BookOpenIcon size={20} />
                                    </div>
                                    <div className={styles.courseInfo}>
                                        <h4 className={styles.courseName}>{course.name}</h4>
                                        <p className={styles.courseCode}>
                                            {course.code}
                                            {formatSchedule(course.schedule) && ` • ${formatSchedule(course.schedule)}`}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <BookOpenIcon size={40} />
                            <p>No courses enrolled yet</p>
                        </div>
                    )}
                </div>

                </div>
            </div>
        
    );
}
