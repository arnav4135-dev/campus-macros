const ROWS = [['protein', 'Protein', 'var(--protein)'], ['carbs', 'Carbs', 'var(--carbs)'], ['fat', 'Fat', 'var(--fat)']];
export default function MacroBars({ totals = {}, targets = {} }) {
  return (
    <div className="bars">
      {ROWS.map(([k, label, color]) => {
        const eaten = totals[k] || 0, target = targets[k] || 0;
        const pct = target ? Math.min(eaten / target, 1) * 100 : 0;
        return (
          <div key={k}>
            <div className="bar-head"><b>{label}</b><span className={eaten > target ? 'over' : ''}>{Math.round(eaten)} / {target} g</span></div>
            <div className="track"><div className="fill" style={{ width: `${pct}%`, background: color }} /></div>
          </div>
        );
      })}
    </div>
  );
}
