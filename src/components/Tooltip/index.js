import React from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

export const ToolTip = ({ align, name, children }) => {
  const renderTooltip = (props) => (
    <Tooltip id="button-tooltip" {...props}>
      {name}
    </Tooltip>
  );
  return (
    <OverlayTrigger
      placement={align ? align : "bottom"}
      delay={{ show: 250, hide: 300 }}
      overlay={renderTooltip}
    >
      {children}
    </OverlayTrigger>
  );
};

