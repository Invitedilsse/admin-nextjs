import React from "react";
import { ViewportContext } from "../context/ViewPortProvider";

const useViewport = () => {
  const { width, height } = React.useContext(ViewportContext);
  const isMobile = width < 900;
  return { width, height, isMobile };
};

export default useViewport;
