import React from 'react';
import SvgIcon from '@material-ui/core/SvgIcon';
import { ReactComponent as Icon } from "../../assets/icons/github_icon.svg";

function GithubIcon(props) {
  return (
    <SvgIcon {...props}>
      <Icon/>
    </SvgIcon>
  );
}

export default GithubIcon;