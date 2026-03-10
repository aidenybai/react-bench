import "react-grab";
import "agentation";
import "./lib/cursor-browser-inspector";
import { generateSnippet } from "react-grab";

declare global {
  interface Window {
    __REACT_GRAB_GENERATE_SNIPPET__?: typeof generateSnippet;
  }
}

if (typeof window !== "undefined") {
  window.__REACT_GRAB_GENERATE_SNIPPET__ = generateSnippet;
}
