import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ParentIcon, ChevronRightIcon } from '../../components/ui/Icons';
import styles from './MyChildren.module.css';

interface Course {
    id: string;
    name: string;
    code: string;
}

interface Child {
    id: string;
    entityId: string;
    accountId?: string;
    firstName: string;
    lastName: string;
    name: string;
    email: string;
    grade: string;
    dateOfBirth?: string;
    avatar: string;
    courses: Course[];
    courseCount: number;
}

export default function MyChildren() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [children, setChildren] = useState<Child[]>([]);
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
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch children');
            }

            const data = await response.json();
            setChildren(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load children');
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewChild = (childId: string) => {
        navigate(`/children/${childId}`);
    };

    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading your children...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <p>{error}</p>
                    <button className={styles.retryBtn} onClick={fetchChildren}>
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <h1 className={styles.title}>
                        <ParentIcon size={32} />
                        My Children
                    </h1>
                </div>
                <p className={styles.subtitle}>
                    View and manage your children's academic progress
                </p>
            </div>

            {/* Children Grid */}
            {children.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <ParentIcon size={40} />
                    </div>
                    <h3 className={styles.emptyTitle}>No Children Linked</h3>
                    <p className={styles.emptyText}>
                        Contact the school administration to link your children to your account.
                    </p>
                </div>
            ) : (
                <div className={styles.childrenGrid}>
                    {children.map((child) => (
                        <div
                            key={child.id}
                            className={styles.childCard}
                            onClick={() => handleViewChild(child.id)}
                        >
                            <div className={styles.cardHeader}>
                                <div className={styles.avatar}>{child.avatar}</div>
                                <div className={styles.childInfo}>
                                    <h3 className={styles.childName}>{child.name}</h3>
                                    <p className={styles.childEmail}>{child.email}</p>
                                </div>
                                {child.grade && (
                                    <span className={styles.gradeBadge}>{child.grade}</span>
                                )}
                            </div>

                            {/* Stats */}
                            <div className={styles.statsRow}>
                                <div className={styles.stat}>
                                    <div className={styles.statValue}>{child.courseCount}</div>
                                    <div className={styles.statLabel}>Courses</div>
                                </div>
                                <div className={styles.stat}>
                                    <div className={styles.statValue}>--</div>
                                    <div className={styles.statLabel}>GPA</div>
                                </div>
                            </div>

                            {/* Courses Preview */}
                            <div className={styles.coursesPreview}>
                                <h4 className={styles.coursesTitle}>Enrolled Courses</h4>
                                {child.courses.length > 0 ? (
                                    <div className={styles.coursesList}>
                                        {child.courses.slice(0, 3).map((course) => (
                                            <span key={course.id} className={styles.courseChip}>
                                                {course.code || course.name}
                                            </span>
                                        ))}
                                        {child.courses.length > 3 && (
                                            <span className={`${styles.courseChip} ${styles.moreCourses}`}>
                                                +{child.courses.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <p className={styles.noCourses}>No courses enrolled</p>
                                )}
                            </div>

                            {/* View Details Button */}
                            <button className={styles.viewDetails}>
                                View Details
                                <ChevronRightIcon size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
