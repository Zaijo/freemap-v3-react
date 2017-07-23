import React from 'react';
import { connect } from 'react-redux';
import { Tooltip } from 'react-leaflet';

import { infoPointChangePosition } from 'fm3/actions/infoPointActions';
import MarkerWithInnerLabel from 'fm3/components/leaflet/MarkerWithInnerLabel';
import PropTypes from 'prop-types';

class InfoPoint extends React.Component {
  static propTypes = {
    lat: PropTypes.number,
    lon: PropTypes.number,
    label: PropTypes.string,
    inEditMode: PropTypes.bool.isRequired,
    onInfoPointPositionChange: PropTypes.func.isRequired,
  };

  handleDragEnd = (e) => {
    const coords = e.target.getLatLng();
    this.props.onInfoPointPositionChange(coords.lat, coords.lng);
  }

  render() {
    const { lat, lon, label, inEditMode } = this.props;
    return (
      lat && <MarkerWithInnerLabel
        faIcon="info"
        faIconLeftPadding="2px"
        draggable={inEditMode}
        onDragend={this.handleDragEnd}
        position={L.latLng(lat, lon)}
      >
        { label && <Tooltip className="compact" offset={new L.Point(9, -25)} direction="right" permanent>
          <span>
            {label}
          </span>
        </Tooltip> }
      </MarkerWithInnerLabel>
    );
  }
}

export default connect(
  state => ({
    lat: state.infoPoint.lat,
    lon: state.infoPoint.lon,
    label: state.infoPoint.label,
    inEditMode: state.infoPoint.inEditMode,
  }),
  dispatch => ({
    onInfoPointPositionChange(lat, lon) {
      dispatch(infoPointChangePosition(lat, lon));
    },
  }),
)(InfoPoint);
