const svgNS = 'http://www.w3.org/2000/svg';
const element = (id) => document.getElementById(id);
const zones = ['North West', 'North East', 'North Central', 'South West', 'South East', 'South South'];
const selector = element('zone');
const search = element('city-search');
const reset = element('reset-filters');
const panel = element('city-panel');
const svgHost = element('pins');
const cityList = element('city-list');

const photographs = {
  lagos: {
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d0/Ikoyi%2C_Lagos%2C_Nigeria.jpg/960px-Ikoyi%2C_Lagos%2C_Nigeria.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Ikoyi,_Lagos,_Nigeria.jpg',
    alt: 'Drone photograph of Ikoyi beside the Lagos Lagoon',
    credit: 'Ikoyi, 2019 · Reginald Bassey',
  },
  ibadan: {
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1e/Agbowo_%26_Bodija_Market_Area_view.jpg/960px-Agbowo_%26_Bodija_Market_Area_view.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Agbowo_%26_Bodija_Market_Area_view.jpg',
    alt: 'Drone photograph of Agbowo and Bodija Market in Ibadan',
    credit: 'Agbowo and Bodija, 2021 · Adebayo Ajibola',
  },
};

function node(tag, className, text) {
  const result = document.createElement(tag);
  result.className = className;
  result.textContent = text;
  return result;
}

function svg(tag, attributes) {
  const result = document.createElementNS(svgNS, tag);
  Object.entries(attributes).forEach(([name, value]) => result.setAttribute(name, value));
  return result;
}

function load(path) {
  return fetch(path).then((response) => {
    if (!response.ok) throw new Error(`Failed to load ${path}`);
    return response.json();
  });
}

function xy(lon, lat) {
  return [(lon - 2) * 46 + 12, (14.4 - lat) * 46 + 12];
}

function pathFromRing(ring) {
  return 'M' + ring.map((point) => xy(...point).join(',')).join('L') + 'Z';
}

function drawBoundary(boundary) {
  const [ring] = boundary.features[0].geometry.coordinates;
  element('nigeria').setAttribute('d', pathFromRing(ring));
  const coastline = ring.slice(0, 10);
  element('water').setAttribute('d', pathFromRing([...coastline, [2.1, 3.4], [8.5, 3.4]]));
  for (let lon = 4; lon <= 14; lon += 2) {
    const [x] = xy(lon, 0);
    element('grid').append(svg('line', {x1: x, x2: x, y1: 18, y2: 485}));
    const label = svg('text', {x, y: 21, class: 'grid-label', 'text-anchor': 'middle'});
    label.textContent = `${lon}° E`;
    element('grid').append(label);
  }
  for (let lat = 6; lat <= 12; lat += 2) {
    const [, y] = xy(0, lat);
    element('grid').append(svg('line', {x1: 20, x2: 655, y1: y, y2: y}));
    const label = svg('text', {x: 646, y: y - 6, class: 'grid-label'});
    label.textContent = `${lat}° N`;
    element('grid').append(label);
  }
}

function fillCityPanel(city) {
  const zone = node('p', 'eyebrow', city.zone);
  const title = node('h2', '', city.name);
  const focus = node('p', 'focus', city.focus);
  const facts = document.createElement('dl');
  for (const [label, value] of [
    ['Survey stage', city.pilot ? 'Proposed field pilot' : 'Desktop baseline'],
    ['Local canopy estimate', 'Pending validation'],
    ['Field observations', 'Pending'],
  ]) {
    const row = document.createElement('div');
    row.append(node('dt', '', label), node('dd', '', value));
    facts.append(row);
  }
  const links = node('div', 'city-links', '');
  const research = node('a', '', 'Open canopy research map');
  research.href = 'https://ee-alegbeleyeokiki.projects.earthengine.app/view/tree-canopy-cover-in-nigeria';
  const streetMap = node('a', '', 'OpenStreetMap');
  streetMap.href = `https://www.openstreetmap.org/#map=12/${city.lat}/${city.lon}`;
  links.append(research, streetMap);
  panel.replaceChildren(zone, title, focus, facts, links);

  const photo = photographs[city.id];
  if (photo) {
    const figure = node('figure', 'city-photo', '');
    const picture = document.createElement('img');
    picture.src = photo.url;
    picture.alt = photo.alt;
    picture.width = 960;
    picture.height = 540;
    const caption = node('figcaption', '', '');
    const source = node('a', '', photo.credit);
    source.href = photo.source;
    const licence = node('a', '', 'CC BY-SA 4.0');
    licence.href = 'https://creativecommons.org/licenses/by-sa/4.0/';
    caption.append(source, ' · ', licence);
    figure.append(picture, caption);
    panel.append(figure);
  }
  panel.append(node('p', 'coordinates mono', `${city.lat.toFixed(3)}° N / ${city.lon.toFixed(3)}° E`));
}

Promise.all([load('data/cities.json'), load('data/nigeria.geojson')]).then(([cities, boundary]) => {
  drawBoundary(boundary);
  for (const name of zones) selector.add(new Option(name, name));
  const requested = new URLSearchParams(location.search).get('city');
  let active = (cities.find((city) => city.id === requested) ?? cities[0]).id;
  const controls = new Map();

  function select(city) {
    active = city.id;
    for (const [id, {pin, button, row}] of controls) {
      const selected = id === active;
      pin.setAttribute('aria-pressed', String(selected));
      button.setAttribute('aria-pressed', String(selected));
      row.classList.toggle('is-selected', selected);
    }
    fillCityPanel(city);
    const url = new URL(location.href);
    url.searchParams.set('city', active);
    history.replaceState(null, '', url);
  }

  function drawCities() {
    controls.clear();
    svgHost.replaceChildren();
    cityList.replaceChildren();
    const query = search.value.trim().toLocaleLowerCase();
    const visible = cities.filter((city) =>
      (!selector.value || city.zone === selector.value) && city.name.toLocaleLowerCase().includes(query)
    );
    reset.hidden = !query && !selector.value;
    element('results-summary').textContent = `${visible.length} of ${cities.length} city profiles`;
    element('directory-empty').hidden = visible.length > 0;

    for (const city of visible) {
      const [x, y] = xy(city.lon, city.lat);
      const [dx, dy] = city.label;
      const pin = svg('g', {class: city.pilot ? 'pin field' : 'pin', role: 'button', tabindex: 0, 'aria-label': city.name, transform: `translate(${x} ${y})`});
      const hit = svg('circle', {r: 18, fill: 'transparent'});
      const halo = svg('circle', {r: 16, class: 'halo'});
      const marker = svg('circle', {r: 5, class: 'marker'});
      const label = svg('text', {x: dx, y: dy, 'text-anchor': dx < 0 ? 'end' : 'start'});
      label.textContent = city.name;
      pin.append(hit, halo, marker, label);
      pin.addEventListener('click', () => select(city));
      pin.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          select(city);
        }
      });
      svgHost.append(pin);

      const row = document.createElement('tr');
      const nameCell = document.createElement('td');
      const button = node('button', '', city.name);
      button.type = 'button';
      button.addEventListener('click', () => {
        select(city);
        element('atlas').scrollIntoView({block: 'start', behavior: 'smooth'});
      });
      nameCell.append(button);
      row.append(nameCell, node('td', '', city.zone), node('td', '', city.pilot ? 'Field pilot' : 'Desktop baseline'));
      cityList.append(row);
      controls.set(city.id, {pin, button, row});
    }

    if (visible.length) {
      select(visible.find((city) => city.id === active) ?? visible[0]);
    } else {
      panel.replaceChildren(node('h2', '', 'No matching cities'), node('p', 'focus', 'Try another city name or reset the filters to explore all twelve profiles.'));
    }
  }

  selector.addEventListener('change', drawCities);
  search.addEventListener('input', drawCities);
  reset.addEventListener('click', () => {
    search.value = '';
    selector.value = '';
    drawCities();
    search.focus();
  });
  drawCities();
}).catch(() => {
  panel.textContent = 'The city map could not load. Download the city roster below to see the proposed coverage.';
  element('results-summary').textContent = 'City data unavailable';
});
