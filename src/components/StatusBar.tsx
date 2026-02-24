interface StatusBarProps {
    activeCacheCount: number;
}

export default function StatusBar({ activeCacheCount }: StatusBarProps) {
    return (
        <div className="status-pill">
            <span className="status-dot" />
            <span>{activeCacheCount} caches remaining</span>
        </div>
    );
}
