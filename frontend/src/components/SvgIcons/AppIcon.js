import React from 'react';
import SvgIcon from '@material-ui/core/SvgIcon';
import { ReactComponent as Icon } from "../../assets/icons/app_icon.svg";

function AppIcon(props) {
  return (
    <SvgIcon {...props}>
      <Icon/>
    </SvgIcon>
  );
}

export default AppIcon;