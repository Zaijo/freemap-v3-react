import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import injectL10n from 'fm3/l10nInjector';
import PropTypes from 'prop-types';
import * as FmPropTypes from 'fm3/propTypes';
import { resolveTrackSurface, resolveTrackClass, resolveBicycleTypeSuitableForTrack } from 'fm3/osmOntologyTools';

function RoadDetails({ way, mapType, language, t }) {
  const dateFormat = new Intl.DateTimeFormat(language, { day: '2-digit', month: '2-digit', year: 'numeric' });

  const trackClass = resolveTrackClass(way.tags);
  const surface = resolveTrackSurface(way.tags);
  const bicycleType = resolveBicycleTypeSuitableForTrack(way.tags);
  const isBicycleMap = mapType === 'C';
  const lastEditAt = dateFormat.format(new Date(way.timestamp));
  return (
    <div>
      <dl className="dl-horizontal">
        <dt>{t('roadDetails.roadType')}</dt>
        <dd>{t(`roadDetails.trackClasses.${trackClass}`) || trackClass}</dd>
        <dt>{t('roadDetails.surface')}</dt>
        <dd>{t(`roadDetails.surfaces.${surface}`) || surface}</dd>
        {isBicycleMap && <dt>{t('roadDetails.suitableBikeType')}</dt>}
        {isBicycleMap && <dd style={{ whiteSpace: 'nowrap' }}>{t(`roadDetails.bicycleTypes.${bicycleType}`)}</dd>}
        <dt>{t('roadDetails.lastChange')}</dt>
        <dd>{lastEditAt}</dd>
      </dl>
      <p>
        {
          <a
            key="allDetails"
            href={`https://www.openstreetmap.org/way/${way.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('roadDetails.showDetails')}
          </a>
        }
      </p>
    </div>
  );
}

RoadDetails.propTypes = {
  language: PropTypes.string,
  t: PropTypes.func.isRequired,
  way: PropTypes.shape({
    tags: PropTypes.object.isRequired,
    id: PropTypes.number.isRequired,
    timestamp: PropTypes.string.isRequired,
  }),
  mapType: FmPropTypes.mapType.isRequired,
};

export default compose(
  injectL10n(),
  connect(
    state => ({
      mapType: state.map.mapType,
      language: state.l10n.language,
    }),
  ),
)(RoadDetails);
