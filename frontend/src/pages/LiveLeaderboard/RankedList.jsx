import {Component, createRef, memo, useCallback} from 'react';
import PlayerAvatar from '../../components/PlayerAvatar/PlayerAvatar.jsx';

const Avatar = memo(PlayerAvatar);
const Row = memo(function Row({missionId, rank, playerName, avatarId, score, completedStations, progressLabel, register}) {
  const ref = useCallback(node => register(missionId, node), [missionId, register]);
  return <div ref={ref} className={`lb-row${rank <= 3 ? ' lb-podium' : ''}`} data-mission={missionId} data-rank={rank} role="listitem">
    <span className={`lb-rank medal-${rank}`} aria-label={String(rank)}>{rank <= 3 ? <svg viewBox="0 0 48 52" aria-hidden="true"><path d="m13 25-4 25 15-8 15 8-4-25" fill="currentColor" opacity=".45"/><circle cx="24" cy="21" r="18" fill="none" stroke="currentColor" strokeWidth="2"/><text x="24" y="27" textAnchor="middle" fill="currentColor" fontSize="18">{rank}</text></svg> : String(rank).padStart(2, '0')}</span>
    <Avatar avatarId={avatarId}/><div className="lb-identity"><bdi title={playerName}>{playerName}</bdi></div>
    <div className="lb-progress" role="progressbar" aria-label={progressLabel} aria-valuemin={0} aria-valuemax={4} aria-valuenow={completedStations}>
      {[1,2,3,4].map(number => <span key={number} className={`lb-segment${number <= completedStations ? ' is-complete' : ''}`} aria-hidden="true"><i/><small>{number}</small></span>)}
    </div>
    <div className="lb-score"><strong>{score.toLocaleString('en-US')}</strong><small dir="ltr">/ 5,000</small></div>
  </div>;
});

// Capture the old *visual* positions before React reorders the DOM. This also
// captures a partially completed transform when another snapshot arrives.
export default class RankedList extends Component {
  area = createRef();
  nodes = new Map();
  animations = new Map();
  register = (id, node) => {
    if (node) this.nodes.set(id, node);
    else {
      this.nodes.delete(id);
      this.animations.get(id)?.cancel();
      this.animations.delete(id);
    }
  };
  getSnapshotBeforeUpdate(previous) {
    const {rows} = this.props;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches ||
        rows.length === previous.rows.length && rows.every((row, i) => row.missionId === previous.rows[i].missionId)) return null;
    const bounds = this.area.current.getBoundingClientRect();
    const positions = new Map();
    const nextRanks = new Map(rows.map(row => [row.missionId, row.rank]));
    const moved = new Set(previous.rows.filter(row => nextRanks.get(row.missionId) !== row.rank).map(row => row.missionId));
    for (const [id, node] of this.nodes) {
      if (!moved.has(id) && !this.animations.has(id)) continue;
      const rect = node.getBoundingClientRect();
      positions.set(id, {top: rect.top, bottom: rect.bottom});
    }
    return {bounds, positions};
  }
  componentDidUpdate(previous, state, snapshot) {
    if (!snapshot) return;
    const {bounds, positions} = snapshot;
    const moves = [];
    // Batch reads before animation writes; no layout read/write loop.
    for (const [id, node] of this.nodes) {
      const old = positions.get(id);
      if (!old) continue;
      const rect = node.getBoundingClientRect();
      const transform = getComputedStyle(node).transform;
      const offset = transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).m42;
      const top = rect.top - offset, bottom = rect.bottom - offset;
      const visible = top < bounds.bottom && bottom > bounds.top || old.top < bounds.bottom && old.bottom > bounds.top;
      moves.push({id, node, delta: old.top - top, visible});
    }
    for (const {id, node, delta, visible} of moves) {
      this.animations.get(id)?.cancel();
      this.animations.delete(id);
      if (!visible || Math.abs(delta) < 0.5) continue;
      const animation = node.animate([{transform: `translateY(${delta}px)`}, {transform: 'translateY(0)'}], {
        duration: 420, easing: 'cubic-bezier(.22,.7,.25,1)',
      });
      this.animations.set(id, animation);
      animation.onfinish = () => {
        if (this.animations.get(id) === animation) this.animations.delete(id);
      };
    }
  }
  componentWillUnmount() {
    for (const animation of this.animations.values()) animation.cancel();
    this.animations.clear();
    this.nodes.clear();
  }
  render() {
    return <div className="lb-list" ref={this.area} role="list" aria-label={this.props.label} tabIndex={0}>
      {this.props.rows.map(({missionId, rank, playerName, avatarId, score, completedStations}) =>
        <Row key={missionId} {...{missionId, rank, playerName, avatarId, score, completedStations}} progressLabel={this.props.progressLabel} register={this.register}/>
      )}
    </div>;
  }
}
