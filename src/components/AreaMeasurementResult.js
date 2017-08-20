import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Marker, Popup, Polygon } from 'react-leaflet';
import RichMarker from 'fm3/components/RichMarker';

import { areaMeasurementAddPoint, areaMeasurementUpdatePoint, areaMeasurementRemovePoint } from 'fm3/actions/areaMeasurementActions';
import { toastsAdd } from 'fm3/actions/toastsActions';

import { area } from 'fm3/geoutils';
import mapEventEmitter from 'fm3/emitters/mapEventEmitter';
import * as FmPropTypes from 'fm3/propTypes';

const nf = Intl.NumberFormat('sk', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

const circularIcon = new L.divIcon({ // CircleMarker is not draggable
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  tooltipAnchor: [10, 0],
  html: '<div class="circular-leaflet-marker-icon"></div>',
});

class AreaMeasurementResult extends React.Component {
  static propTypes = {
    points: FmPropTypes.points.isRequired,
    onPointAdd: PropTypes.func.isRequired,
    onPointUpdate: PropTypes.func.isRequired,
    onPointRemove: PropTypes.func.isRequired,
  };

  componentWillMount() {
    mapEventEmitter.on('mapClick', this.handlePoiAdd);
  }

  componentWillUnmount() {
    mapEventEmitter.removeListener('mapClick', this.handlePoiAdd);
  }

  handlePoiAdd = (lat, lon, position, id0) => {
    const { points } = this.props;
    const pos = position ? Math.ceil(position / 2) : points.length;
    let id;
    if (id0) {
      id = id0;
    } else if (pos === 0) {
      id = points.length ? points[pos].id - 1 : 0;
    } else if (pos === points.length) {
      id = points[pos - 1].id + 1;
    } else {
      id = (points[pos - 1].id + points[pos].id) / 2;
    }
    this.props.onPointAdd({ lat, lon, id }, pos);
  }

  handleMeasureMarkerDrag(i, { latlng: { lat, lng: lon } }, id) {
    this.props.onPointUpdate(i, { lat, lon, id });
  }

  handleMarkerClick(id) {
    this.props.onPointRemove(id);
  }

  render() {
    const { points } = this.props;
    const ps = [];
    for (let i = 0; i < points.length; i += 1) {
      ps.push(points[i]);
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      const lat = (p1.lat + p2.lat) / 2;
      const lon = (p1.lon + p2.lon) / 2;
      ps.push({ lat, lon, id: (i + 1) === points.length ? p1.id + 1 : (p1.id + p2.id) / 2 });
    }
    const areaSize = points.length >= 3 ? area(points) : NaN;
    let northmostPoint = points[0];
    points.forEach((p) => {
      if (northmostPoint.lat < p.lat) {
        northmostPoint = p;
      }
    });

    return (
      <div>
        {!isNaN(areaSize) &&
          <RichMarker
            autoOpenPopup
            interactive={false}
            opacity={0}
            position={L.latLng(northmostPoint.lat, northmostPoint.lon)}
          >
            <Popup closeButton={false} autoClose={false} autoPan={false}>
              <span>
                <div>{nf.format(areaSize)} m<sup>2</sup></div>
                <div>{nf.format(areaSize / 100)} a</div>
                <div>{nf.format(areaSize / 10000)} ha</div>
                <div>{nf.format(areaSize / 1000000)} km<sup>2</sup></div>
              </span>
            </Popup>
          </RichMarker>
        }
        {ps.map((p, i) => {
          const props = i % 2 ? {
            icon: circularIcon,
            opacity: 0.5,
            onDragstart: e => this.handlePoiAdd(e.target.getLatLng().lat, e.target.getLatLng().lng, i, p.id),
          } : {
            // icon: defaultIcon, // NOTE changing icon doesn't work: https://github.com/Leaflet/Leaflet/issues/4484
            icon: circularIcon,
            opacity: 1,
            onDrag: e => this.handleMeasureMarkerDrag(i / 2, e, p.id),
            onClick: () => this.handleMarkerClick(p.id),
          };

          return (
            <Marker
              key={p.id}
              draggable
              position={L.latLng(p.lat, p.lon)}
              {...props}
            >
              {/* i % 2 === 0 &&
                <Tooltip className="compact" offset={[-4, 0]} direction="right" permanent>
                  <span>{nf.format(dist / 1000)} km</span>
                </Tooltip>
              */}
            </Marker>
          );
        })}

        {ps.length > 2 && <Polygon positions={ps.filter((_, i) => i % 2 === 0).map(({ lat, lon }) => [lat, lon])} /> }
      </div>
    );
  }
}

export default connect(
  state => ({
    points: state.areaMeasurement.points,
  }),
  dispatch => ({
    onPointAdd(coordinates, position) {
      dispatch(areaMeasurementAddPoint(coordinates, position));
    },
    onPointUpdate(i, coordinates) {
      dispatch(areaMeasurementUpdatePoint(i, coordinates));
    },
    onPointRemove(i) {
      dispatch(toastsAdd({
        collapseKey: 'areaMeasurement.removePoint',
        message: 'Odstrániť bod?',
        style: 'warning',
        cancelType: 'SET_TOOL',
        actions: [
          { name: 'Áno', action: areaMeasurementRemovePoint(i), style: 'danger' },
          { name: 'Nie' },
        ],
      }));
    },
  }),
)(AreaMeasurementResult);
