import React from 'react'

export default function SerialNumberGenerator({row,table}) {
  const { pagination } = table.getState();
  const currentPage = pagination.pageIndex;
  const pageSize = pagination.pageSize;
  return <div>{currentPage * pageSize + row.index + 1}</div>;
}

