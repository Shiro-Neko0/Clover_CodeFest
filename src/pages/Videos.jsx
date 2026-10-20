import { useState } from 'react';
import { VIDEOS } from '../data/videos.js';
import Icon from '../components/Icon.jsx';
import { useTranslation } from '../i18n.js';

const TAGS = [['All', 'videoTagAll'], ['Exercise', 'videoTagExercise'], ['Diet', 'videoTagDiet'], ['Heart', 'videoTagHeart'], ['Medication', 'videoTagMedication']];
const GRADIENTS = ['g1', 'g2', 'g3', 'g4'];
const VIDEO_TITLE_KEYS = { 1: 'videoTitleChair', 2: 'videoTitleBreakfast', 3: 'videoTitleBloodPressure', 4: 'videoTitleMedicineFood' };

// TikTok-style feed: one video per screen, swipe up for the next (CSS scroll-snap).
export default function Videos() {
  const { t } = useTranslation();
  const [tag, setTag] = useState('All');
  const [liked, setLiked] = useState({});
  const list = VIDEOS.filter((v) => tag === 'All' || v.tag === tag);

  return (
    <>
      <div className="feedtop">
        <div className="chips">{TAGS.map(([value, key]) => <button key={value} className="chip" aria-pressed={tag === value} onClick={() => setTag(value)}>{t(key)}</button>)}</div>
      </div>
      <div className="feed">
        {list.map((v, i) => (
          <article key={v.id} className={`vid ${GRADIENTS[i % 4]}`}>
            {v.url
              ? <video src={v.url} controls playsInline loop style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: 0, maxHeight: 'none' }} />
              : <button className="playbtn" aria-label={t('videoComingSoon')}><Icon name="play" size={40} /></button>}
            <span className="tag">{t(`videoTag${v.tag}`)}</span>
            <div className="rail">
              <button aria-pressed={!!liked[v.id]} onClick={() => setLiked({ ...liked, [v.id]: !liked[v.id] })}><Icon name="heart" size={32} />{liked[v.id] ? t('liked') : t('like')}</button>
            </div>
            <div className="meta" style={{ pointerEvents: 'none' }}>
              <h3>{t(VIDEO_TITLE_KEYS[v.id])}</h3>
              <div className="by">{v.by}</div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
