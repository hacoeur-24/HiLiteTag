import React, { type CSSProperties } from "react";

type MarkerProps = {
  tagId: string;
  style?: CSSProperties;
  color?: string;
  children: React.ReactNode;
};

export const Marker = ({ tagId, style, color, children }: MarkerProps) => {
  return (
    <span
      data-tag-id={tagId}
      className="marker"
      style={{ background: color, ...style }}
    >
      {children}
    </span>
  );
};