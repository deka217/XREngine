import React, { useEffect, createContext, useContext } from "react";
import PropTypes from "prop-types";
import useHover from "../hooks/useHover";

const AudioPreviewContext = createContext(new Audio());

/**
 * [AudioPreview description]
 * @param       {[type]} src      [description]
 * @param       {[type]} children [description]
 * @constructor
 */
export default function AudioPreview({ src, children }) {
  const audio = useContext(AudioPreviewContext);
  const [hoverRef, isHovered] = useHover();

  useEffect(() => {
    if (isHovered) {
      audio.src = src;
      audio.play();
    } else {
      audio.pause();
    }
  }, [isHovered, src, audio]);
  /* @ts-ignore */
  return <div ref={hoverRef}>{children}</div>;
}

AudioPreview.propTypes = {
  src: PropTypes.string,
  children: PropTypes.node
};
