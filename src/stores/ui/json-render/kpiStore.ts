import { atom } from 'nanostores';
import { updateAtomDeep } from './utils';

export type TitleStyle = {
  fontFamily?: string;
  fontWeight?: string | number;
  fontSize?: number | string;
  color?: string;
  letterSpacing?: number | string;
  textTransform?: 'none'|'uppercase'|'lowercase'|'capitalize';
  padding?: number | string;
  margin?: number | string;
  textAlign?: 'left'|'center'|'right';
};

// Old Kpi component defaults (label/value only)
export type KpiDefaults = {
  format: 'currency'|'percent'|'number';
  unit?: string;
  trend?: 'auto'|'up'|'down'|'flat';
  labelStyle?: TitleStyle;
  valueStyle?: TitleStyle;
};

export const $kpiDefaults = atom<KpiDefaults>({
  format: 'number',
  trend: 'auto',
  labelStyle: {
    fontFamily: 'Barlow',
    fontWeight: 600,
    fontSize: 12,
    color: '#64748b',
    textTransform: 'none',
    textAlign: 'left',
  },
  valueStyle: {
    fontFamily: 'Barlow',
    fontWeight: 700,
    fontSize: 22,
    color: '#0f172a',
    textTransform: 'none',
    textAlign: 'left',
  }
});

export const kpiDefaultsActions = {
  set(partial: Partial<KpiDefaults>) {
    updateAtomDeep($kpiDefaults as any, partial as any);
  }
};

// New KPI component defaults (with container)
export type ContainerStyle = {
  backgroundColor?: string;
  borderColor?: string;
  borderStyle?: string;
  borderWidth?: number | string;
  borderRadius?: number | string;
  boxShadow?: string;
  padding?: number | string;
  margin?: number | string;
};

export type KPIDefaults = {
  format: 'currency'|'percent'|'number';
  unit?: string;
  titleStyle?: TitleStyle;
  valueStyle?: TitleStyle;
  containerStyle?: ContainerStyle;
  borderless?: boolean;
};

export const $KPIDefaults = atom<KPIDefaults>({
  format: 'number',
  titleStyle: {
    fontFamily: 'Barlow',
    fontWeight: 600,
    fontSize: 12,
    color: '#64748b',
    textTransform: 'none',
    textAlign: 'left',
  },
  valueStyle: {
    fontFamily: 'Barlow',
    fontWeight: 700,
    fontSize: 24,
    color: '#0f172a',
    textTransform: 'none',
    textAlign: 'left',
  },
  containerStyle: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: 8,
    padding: 12,
  },
  borderless: false,
});

export const KPIDefaultsActions = {
  set(partial: Partial<KPIDefaults>) {
    updateAtomDeep($KPIDefaults as any, partial as any);
  }
};
