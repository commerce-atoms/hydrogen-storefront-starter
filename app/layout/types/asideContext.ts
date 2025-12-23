import type {Aside} from './aside';

export interface AsideContextValue {
  type: Aside;
  open: (mode: Aside) => void;
  close: () => void;
}
