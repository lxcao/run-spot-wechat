const SHANGHAI = 'Asia/Shanghai';

function todayISO(now = new Date(), timeZone = SHANGHAI) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

function annotateEventStatus(event, today = todayISO()) {
  const date = event.date || '';
  const _status = date < today ? 'past' : event.status === 'past' ? 'past' : 'upcoming';
  return { ...event, _status };
}

function expireStoredStatus(event, today = todayISO()) {
  const annotated = annotateEventStatus(event, today);
  if ((event.date || '') < today) {
    return { ...annotated, status: 'past' };
  }
  return annotated;
}

module.exports = { todayISO, annotateEventStatus, expireStoredStatus };
