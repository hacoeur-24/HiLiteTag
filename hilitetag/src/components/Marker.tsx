import React from "react";

type MarkerProps = {
  tagId: string;
  children: React.ReactNode;
};

export const Marker = ({ tagId, children }: MarkerProps) => {
  return <span data-tag-id={tagId} className="marker">{children}</span>;
};