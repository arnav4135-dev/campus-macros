const n = (v) => (v == null ? '–' : Math.round(v));
export default function FoodRow({ item, onClick }) {
  return (
    <button className="food" onClick={onClick}>
      <div style={{ flex: 1 }}>
        <div className="name">{item.name}{item.estimated ? <span className="est">est.</span> : null}</div>
        {(item.detail || item.portion) ? <div className="detail">{[item.detail, item.portion].filter(Boolean).join(' · ')}</div> : null}
        <div className="macros">{n(item.calories)} kcal · <span className="p">{n(item.protein)}p</span> · <span className="c">{n(item.carbs)}c</span> · <span className="f">{n(item.fat)}f</span></div>
      </div>
    </button>
  );
}
