export type Meet = {
  name: string;
  address: string;
  lng: number | null;
  lat: number | null;
  poiid: string | null;
};

export type Photo = {
  fileID: string;
  uploader: string;
  uploaderName: string;
  uploadedAt: string;
  size: number;
};

export type EventItem = {
  id: string;
  title: string;
  date: string;
  weekday: string;
  time: string;
  status: string;
  meet: Meet;
  starbucks: Meet | null;
  route: string | null;
  note: string | null;
  attendees: number | null;
  weather: string | null;
  photos?: Photo[];
  _status?: string;
};

export type Team = {
  id: string;
  name: string;
  slogan: string;
  city: string;
  admins?: string[];
  webAdmins?: string[];
};
