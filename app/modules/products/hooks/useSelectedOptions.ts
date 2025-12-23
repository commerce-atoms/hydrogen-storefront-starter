import {useMemo} from 'react';
import {useSearchParams} from 'react-router';

import {getSelectedOptionsFromUrl} from '@shoppy/variants/getSelectedOptionsFromUrl';

export function useSelectedOptions(optionNames: string[]) {
  const [searchParams] = useSearchParams();

  return useMemo(() => {
    return getSelectedOptionsFromUrl(searchParams, optionNames);
  }, [searchParams, optionNames]);
}
