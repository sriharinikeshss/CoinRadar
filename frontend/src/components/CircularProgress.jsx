export default function CircularProgress({ value, size = 52, strokeWidth = 4, color = '#00ff88', label }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="circular-progress" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          className="circular-progress-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className="circular-progress-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            '--circumference': circumference,
            animation: `ringFill 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
          }}
        />
      </svg>
      <div className="circular-progress-text" style={{ color }}>
        {value}%
      </div>
    </div>
  );
}
