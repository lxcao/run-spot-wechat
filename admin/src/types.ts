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

export type MenuOption = { group: string; id: string; label: string };

export type RunnerDrink = {
  itemId: string;
  name: string;
  options: MenuOption[];
};

export type RunnerFood = {
  itemId: string;
  name: string;
};

export type Runner = {
  id: string;
  nickname: string;
  drinks: RunnerDrink[];
  foods: RunnerFood[];
};

export type MenuItem = { id: string; category: string; name: string; subtitle?: string; new?: boolean };

export type MenuChoice = { id: string; label: string; recommended?: boolean };

export type StarbucksMenu = {
  id: string;
  customizations: Record<string, unknown>;
  drinks: MenuItem[];
  foods: MenuItem[];
};
