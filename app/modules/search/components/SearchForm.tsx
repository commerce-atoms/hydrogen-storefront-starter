import {useRef, type ReactNode} from 'react';
import {Form, type FormProps} from 'react-router';

import styles from './search-form.module.css';

type SearchFormChildren = (args: {
  inputRef: React.MutableRefObject<HTMLInputElement | null>;
}) => ReactNode;

type SearchFormProps = Omit<FormProps, 'children'> & {
  children: SearchFormChildren;
};

export function SearchForm({
  children,
  className = styles.searchForm,
  ...props
}: SearchFormProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  if (typeof children !== 'function') {
    return null;
  }

  return (
    <Form method="GET" {...props} className={className}>
      {children({inputRef})}
    </Form>
  );
}
