import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ChartIcon, BookOpenIcon } from '../../components/ui/Icons';
import styles from './ParentGrades.module.css';

interface Course {
    id: string;
    name: string;
    code: string;
}

interface Child {
    id: string;
    name: string;
    avatar: string;
    grade?: string;
    courses: Course[];
}

export default function ParentGrades() {
    const { token } = useAuth();
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

            const response = await fetch('http://localhost:4000/api/parents/me/children', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch children');
            }

            const data = await response.json();
            setChildren(data);

            if (data.length > 0) {
                setSelectedChildId(data[0].id);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    const selectedChild = children.find(c => c.id === selectedChildId);

    const getGradeClass = (grade: string | undefined): string => {
        if (!grade) return styles.gradeNA;
        const g = grade.toUpperCase();
        if (g.startsWith('A')) return styles.gradeA;
        if (g.startsWith('B')) return styles.gradeB;
        if (g.startsWith('C')) return styles.gradeC;
        if (g.startsWith('D')) return styles.gradeD;
        if (g.startsWith('F')) return styles.gradeF;
        return styles.gradeNA;
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
                                <h4>--</h4>
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
                                                    <span className={`${styles.gradeBadge} ${getGradeClass(undefined)}`}>
                                                        --
                                                    </span>
                                                </td>
                                                <td style={{ color: '#22c55e' }}>Active</td>
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
