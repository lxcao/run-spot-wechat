import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AddressSuggest, type AddressPlace } from '../components/AddressSuggest';
import { PhotoGrid } from '../components/PhotoGrid';
import { callFn } from '../lib/api';
import { isCreateRoute } from '../lib/events';
import type { EventItem, Photo } from '../types';

type Mode = 'create' | 'edit';
type Status = 'auto' | 'upcoming' | 'past';

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: 'auto', label: '自动' },
  { value: 'upcoming', label: '即将' },
  { value: 'past', label: '历史' },
];

type PlaceFields = {
  name: string;
  address: string;
  lng: number | null;
  lat: number | null;
};

function emptyPlace(): PlaceFields {
  return { name: '', address: '', lng: null, lat: null };
}

function fromMeet(meet: EventItem['meet'] | null | undefined): PlaceFields {
  if (!meet) return emptyPlace();
  return {
    name: meet.name || '',
    address: meet.address || '',
    lng: meet.lng ?? null,
    lat: meet.lat ?? null,
  };
}

function asPlace(place: PlaceFields) {
  return {
    name: place.name,
    address: place.address,
    lng: place.lng,
    lat: place.lat,
  };
}

export function EventFormPage({ mode }: { mode: Mode }) {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isCreate = mode === 'create' || isCreateRoute(location.pathname);

  const [date, setDate] = useState('');
  const [time, setTime] = useState('07:00');
  const [status, setStatus] = useState<Status>('auto');
  const [meet, setMeet] = useState<PlaceFields>(emptyPlace);
  const [starbucks, setStarbucks] = useState<PlaceFields>(emptyPlace);
  const [route, setRoute] = useState('');
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!isCreate);
  const [pending, setPending] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isCreate || !id) {
      setDate('');
      setTime('07:00');
      setStatus('auto');
      setMeet(emptyPlace());
      setStarbucks(emptyPlace());
      setRoute('');
      setNote('');
      setPhotos([]);
      setError('');
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await callFn<EventItem>('getEvent', { id });
        if (cancelled) return;
        if (!res.ok || !res.data) {
          setError(res.msg);
          setPhotos([]);
          return;
        }
        const event = res.data;
        setDate(event.date || id);
        setTime(event.time || '07:00');
        setStatus(event.status === 'upcoming' || event.status === 'past' ? event.status : 'auto');
        setMeet(fromMeet(event.meet));
        setStarbucks(fromMeet(event.starbucks));
        setRoute(event.route || '');
        setNote(event.note || '');
        setPhotos(event.photos || []);
      } catch (err) {
        if (cancelled) return;
        setPhotos([]);
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isCreate]);

  function onMeetNameChange(name: string) {
    setMeet({ name, address: '', lng: null, lat: null });
  }

  function onMeetSelect(place: AddressPlace) {
    setMeet(place);
  }

  function onSbuxNameChange(name: string) {
    setStarbucks({ name, address: '', lng: null, lat: null });
  }

  function onSbuxSelect(place: AddressPlace) {
    setStarbucks(place);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!date) {
      setError('请选择日期');
      return;
    }
    if (!time) {
      setError('请选择时间');
      return;
    }
    if (!meet.name) {
      setError('请填写集合点');
      return;
    }

    setPending(true);
    setError('');
    const payload: Record<string, unknown> = {
      time,
      meet: asPlace(meet),
      starbucks: starbucks.name ? asPlace(starbucks) : null,
      route: route || null,
      note: note || null,
    };
    if (status !== 'auto') payload.status = status;

    try {
      if (isCreate) {
        const res = await callFn<{ event: EventItem }>('createEvent', { ...payload, date });
        if (!res.ok) {
          setError(res.msg);
          return;
        }
        navigate(`/events/${res.data?.event?.id || date}`);
        return;
      }

      const res = await callFn<{ event: EventItem }>('updateEvent', {
        ...payload,
        id,
        title: meet.name,
      });
      if (!res.ok) {
        setError(res.msg);
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setPending(false);
    }
  }

  async function onDelete() {
    if (!id) return;
    if (!window.confirm('确定删除该活动？')) return;
    setDeleting(true);
    setError('');
    try {
      const res = await callFn('deleteEvent', { id });
      if (!res.ok) {
        setError(res.msg);
        return;
      }
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="form-page">
      <header className="form-header">
        <div>
          <h1>{isCreate ? '新活动' : '编辑活动'}</h1>
          <Link to="/" className="form-back">
            返回列表
          </Link>
        </div>
      </header>

      {loading ? <p>加载中...</p> : null}
      {error ? <p className="auth-error" role="alert">{error}</p> : null}

      {!loading ? (
        <form className="event-form" onSubmit={onSubmit}>
          <label htmlFor="date">日期</label>
          <input
            id="date"
            name="date"
            type="date"
            value={date}
            readOnly={!isCreate}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <label htmlFor="time">集合时间</label>
          <input
            id="time"
            name="time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />

          <fieldset className="status-options">
            <legend>活动状态</legend>
            {STATUS_OPTIONS.map((option) => (
              <label key={option.value} className={status === option.value ? 'is-active' : undefined}>
                <input
                  type="radio"
                  name="status"
                  value={option.value}
                  checked={status === option.value}
                  onChange={() => setStatus(option.value)}
                />
                {option.label}
              </label>
            ))}
          </fieldset>

          <label htmlFor="meet-name">集合点</label>
          <AddressSuggest
            id="meet-name"
            value={meet.name}
            placeholder="输入地点名称（联想）"
            onNameChange={onMeetNameChange}
            onSelect={onMeetSelect}
          />

          <label htmlFor="meet-address">集合点地址</label>
          <input
            id="meet-address"
            name="meetAddress"
            value={meet.address}
            placeholder="详细地址（可选）"
            onChange={(e) => setMeet((prev) => ({ ...prev, address: e.target.value }))}
          />

          <label htmlFor="sbux-name">跑完星巴克</label>
          <AddressSuggest
            id="sbux-name"
            value={starbucks.name}
            placeholder="输入星巴克名称（联想）"
            onNameChange={onSbuxNameChange}
            onSelect={onSbuxSelect}
          />

          <label htmlFor="route">路线</label>
          <input
            id="route"
            name="route"
            value={route}
            placeholder="如：徐汇滨江绿地"
            onChange={(e) => setRoute(e.target.value)}
          />

          <label htmlFor="note">备注</label>
          <input
            id="note"
            name="note"
            value={note}
            placeholder="如：穿跑团服装"
            onChange={(e) => setNote(e.target.value)}
          />

          <div className="form-actions">
            <button type="submit" disabled={pending || deleting}>
              {pending ? '保存中...' : isCreate ? '确认添加' : '保存'}
            </button>
            {!isCreate ? (
              <button
                type="button"
                className="form-delete"
                onClick={onDelete}
                disabled={pending || deleting}
              >
                {deleting ? '删除中...' : '删除活动'}
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      {!loading && !error && !isCreate && id ? <PhotoGrid eventId={id} photos={photos} /> : null}
    </main>
  );
}
