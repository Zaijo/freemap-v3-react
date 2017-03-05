import React from 'react';
import {AsyncTypeahead} from 'react-bootstrap-typeahead';
import Navbar from 'react-bootstrap/lib/Navbar';

import '../styles/search.scss';

export default class Search extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      searchSuggestions: [],
      searchQuery: ''
    };
  }

  doSearch(searchQuery) {
    if (!searchQuery) {
      return;
    }
    this.setState({ searchQuery });

    const { lat, lon, zoom } = this.props;

    // fetch(`https://www.freemap.sk/api/0.1/q/${encodeURIComponent(searchQuery)}&lat=${lat}&lon=${lon}&zoom=${zoom}`, {
    fetch(`https://nominatim.openstreetmap.org/search/${encodeURIComponent(searchQuery)}`
        + `?format=jsonv2&lat=${lat}&lon=${lon}&zoom=${zoom}&namedetails=1&extratags=1&countrycodes=SK`, {
      method: 'GET'
    }).then(res => res.json()).then(data => {
      const searchSuggestions = data.map((d, id) => {
        const name = d.namedetails.name;
        const tags = { name, type: d.type };
        return { id, label: name, lat: parseFloat(d.lat), lon: parseFloat(d.lon), tags };
      });
      this.setState({ searchSuggestions });
    });
  }

  onSelectionChange(selectedResults) {
    this.props.onSelectSearchResult(selectedResults[0]);
  }

  onSuggestionHighlightChange(result) {
    this.props.onSearchSuggestionHighlightChange(result);
  }

  render() {
    const b = (fn, ...args) => fn.bind(this, ...args);

    return (
      <Navbar.Form pullLeft id="search">
          <AsyncTypeahead
            labelKey="label"
            useCache={false}
            minLength={3}
            delay={500}
            ignoreDiacritics={true}
            onSearch={b(this.doSearch)}
            options={this.state.searchSuggestions}
            searchText="Hľadám ..."
            placeholder="Brusno"
            clearButton={true}
            onChange={b(this.onSelectionChange)}
            emptyLabel={'Nenašli sme žiadne výsledky'}
            renderMenuItemChildren={(result) => (
              <div key={result.label + result.id}
                  onMouseEnter={b(this.onSuggestionHighlightChange, result)}
                  onMouseLeave={b(this.onSuggestionHighlightChange, null)}>
                <span>{result.tags.name} </span><br/>
                <span>({result.tags.type})</span>
              </div>
            )}
          />
      </Navbar.Form>
    );
  }
}

Search.propTypes = {
  lat: React.PropTypes.number,
  lon: React.PropTypes.number,
  zoom: React.PropTypes.number,
  onSearchSuggestionHighlightChange: React.PropTypes.func.isRequired,
  onSelectSearchResult: React.PropTypes.func.isRequired
};