import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export default function Card({ hover = false, className = '', ...rest }: CardProps) {
  return (
    <div
      className={`card-surface ${hover ? 'transition-shadow duration-200 hover:shadow-cardHover' : ''} ${className}`}
      {...rest}
    />
  );
}
