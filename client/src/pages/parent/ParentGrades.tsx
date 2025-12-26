import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ChartIcon, BookOpenIcon } from '../../components/ui/Icons';
import styles from './ParentGrades.module.css';

interface Course {
    id: string;
    name: string;
    code: string;
    grade?: string | null;
}

interface Child {
    id: string;
    name: string;
    avatar: string;
    grade?: string;
    averageGrade?: string | null;
    averageGradePoints?: number | null;
    courses: Course[];
}

export default function ParentGrades() {
    const { token } = useAuth();
    const apiBase = (import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:4000/api');
    const [searchParams] = useSearchParams();
    const [children, setChildren] = useState<Child[]>([]);
    const [selectedChildId, setSelectedChildId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchChildren();
    }, []);

    const fetchChildren = async () => {
        try {
            setIsLoading(true);
            setError('');

            const response = await fetch(`${apiBase}/parents/me/children`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch children');
            }

            const data = await response.json();
            setChildren(data);

            if (data.length > 0) {
                const childIdFromQuery = searchParams.get('childId');
                const match = childIdFromQuery && data.find((c: Child) => c.id === childIdFromQuery);
                setSelectedChildId(match ? match.id : data[0].id);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    const selectedChild = children.find(c => c.id === selectedChildId);

    const toLetter = (grade: string | undefined | null): string | null => {
        if (!grade) return null;
        // If numeric string, map to letter using 100-scale
        if (!isNaN(Number(grade))) {
            const score = Number(grade);
            if (score >= 90) return 'A';
            if (score >= 80) return 'B';
            if (score >= 70) return 'C';
            if (score >= 60) return 'D';
            return 'F';
        }
        return grade.toUpperCase();
    };

    const getGradeClass = (grade: string | undefined | null): string => {
        const letter = toLetter(grade);
        if (!letter) return styles.gradeNA;
        const g = letter;
        if (g.startsWith('A')) return styles.gradeA;
        if (g.startsWith('B')) return styles.gradeB;
        if (g.startsWith('C')) return styles.gradeC;
        if (g.startsWith('D')) return styles.gradeD;
        if (g.startsWith('F')) return styles.gradeF;
        return styles.gradeNA;
    };

    const getGradeColor = (grade: string | undefined | null): string => {
        const letter = toLetter(grade);
        if (!letter) return '#9ca3af';
        if (letter.startsWith('A')) return '#22c55e';
        if (letter.startsWith('B')) return '#3b82f6';
        if (letter.startsWith('C')) return '#f59e0b';
        if (letter.startsWith('D')) return '#ef4444';
        if (letter.startsWith('F')) return '#dc2626';
        return '#9ca3af';
    };

    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading grades...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>
                        <ChartIcon size={32} />
                        Children's Grades
                    </h1>
                </div>
                <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    padding: '16px',
                    borderRadius: '12px',
                    textAlign: 'center'
                }}>
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>
                    <ChartIcon size={32} />
                    Children's Grades
                </h1>
                <p className={styles.subtitle}>
                    View academic progress and course grades for your children
                </p>
            </div>

            {children.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <ChartIcon size={32} />
                    </div>
                    <h3>No Children Found</h3>
                    <p>Contact the school to link your children to your account.</p>
                </div>
            ) : (
                <>
                    {/* Child Selector */}
                    {children.length > 1 && (
                        <div className={styles.childSelector}>
                            {children.map(child => (
                                <button
                                    key={child.id}
                                    className={`${styles.childTab} ${selectedChildId === child.id ? styles.active : ''}`}
                                    onClick={() => setSelectedChildId(child.id)}
                                >
                                    <span className={styles.childAvatar}>{child.avatar}</span>
                                    <span className={styles.childName}>{child.name}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Stats */}
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <div className={`${styles.statIcon} ${styles.primary}`}>
                                <BookOpenIcon size={24} />
                            </div>
                            <div className={styles.statInfo}>
                                <h4>{selectedChild?.courses?.length || 0}</h4>
                                <p>Enrolled Courses</p>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={`${styles.statIcon} ${styles.info}`}>
                                <ChartIcon size={24} />
                            </div>
                            <div className={styles.statInfo}>
                                <h4>{selectedChild?.averageGrade || '--'}</h4>
                                <p>Average Grade</p>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={`${styles.statIcon} ${styles.warning}`}>
                                <ChartIcon size={24} />
                            </div>
                            <div className={styles.statInfo}>
                                <h4>{selectedChild?.grade || 'N/A'}</h4>
                                <p>Grade Level</p>
                            </div>
                        </div>
                    </div>

                    {/* Courses & Grades Table */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h3 className={styles.cardTitle}>
                                <BookOpenIcon size={20} />
                                Course Grades for {selectedChild?.name}
                            </h3>
                        </div>

                        {selectedChild?.courses && selectedChild.courses.length > 0 ? (
                            <div className={styles.tableWrapper}>
                                <table className={styles.gradesTable}>
                                    <thead>
                                        <tr>
                                            <th>Course</th>
                                            <th>Code</th>
                                            <th>Grade</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedChild.courses.map(course => (
                                            <tr key={course.id}>
                                                <td style={{ fontWeight: 500 }}>{course.name}</td>
                                                <td>
                                                    <span className={styles.courseCode}>{course.code || 'N/A'}</span>
                                                </td>
                                                <td>
                                                    <span
                                                        className={`${styles.gradeBadge} ${getGradeClass(course.grade)}`}
                                                        style={{
                                                            background: getGradeColor(course.grade),
                                                            color: 'white',
                                                            padding: '6px 12px',
                                                            borderRadius: '6px',
                                                            fontWeight: 600,
                                                            display: 'inline-block'
                                                        }}
                                                    >
                                                        {course.grade || 'N/A'}
                                                    </span>
                                                </td>
                                                    <td style={{ color: course.grade ? '#22c55e' : 'var(--text-secondary)' }}>
                                                        {course.grade ? 'Graded' : 'Active'}
                                                    </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <BookOpenIcon size={40} />
                                <p>No courses enrolled yet</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
