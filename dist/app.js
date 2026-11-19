const svgNS = 'http://www.w3.org/2000/svg';
const element = (id) => document.getElementById(id);
const zones = ['North West', 'North East', 'North Central', 'South West', 'South East', 'South South'];
const selector = element('zone');
const panel = element('city-panel');
const svgHost = element('pins');
const cityList = element('city-list');
const chart = element('zone-chart');

function svg(tag, attrs) {
  const result = document.createElementNS(svgNS, tag);
  Object.entries(attrs).forEach(([name, value]) => result.setAttribute(name, value));
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

function drawBoundary(boundary) {
  const [ring] = boundary.features[0].geometry.coordinates;
  element('nigeria').setAttribute('d', 'M' + ring.map((point) => xy(...point).join(',')).join('L') + 'Z');
  for (let lon = 4; lon <= 14; lon += 2) {
    const [x] = xy(lon, 0);
    element('grid').append(svg('line', {x1: x, x2: x, y1: 18, y2: 505}));
  }
  for (let lat = 6; lat <= 14; lat += 2) {
    const [, y] = xy(0, lat);
    element('grid').append(svg('line', {x1: 20, x2: 655, y1: y, y2: y}));
  }
}

function fillCityPanel(city) {
  const zone = document.createElement('p');
  zone.className = 'overline dark';
  zone.textContent = city.zone.toUpperCase();
  const title = document.createElement('h3');
  title.textContent = city.name;
  const focus = document.createElement('p');
  focus.className = 'focus';
  focus.textContent = city.focus;
  const facts = document.createElement('dl');
  for (const [label, value] of [
    ['Planned coverage', city.pilot ? 'Proposed field pilot' : 'Desktop baseline'],
    ['Canopy estimate', 'Pending local review'],
    ['Tree and shade surveys', 'Pending'],
  ]) {
    const row = document.createElement('div');
    const term = document.createElement('dt');
    const definition = document.createElement('dd');
    term.textContent = label;
    definition.textContent = value;
    row.append(term, definition);
    facts.append(row);
  }
  const streetMap = document.createElement('a');
  streetMap.className = 'text-link';
  streetMap.textContent = 'Open street map';
  streetMap.href = `https://www.openstreetmap.org/#map=12/${city.lat}/${city.lon}`;
  const layers = document.createElement('a');
  layers.className = 'text-link';
  layers.href = 'https://ee-alegbeleyeokiki.projects.earthengine.app/view/tree-canopy-cover-in-nigeria';
  layers.textContent = 'Nigeria canopy layers';
  panel.replaceChildren(zone, title, focus, facts, streetMap, layers);
}

function drawChart(cities) {
  for (const name of zones) {
    const matches = cities.filter((city) => city.zone === name);
    const row = document.createElement('div');
    const label = document.createElement('span');
    label.textContent = name;
    const bar = document.createElement('span');
    bar.className = 'bar';
    bar.setAttribute('aria-hidden', 'true');
    for (const city of matches) {
      const segment = document.createElement('i');
      if (city.pilot) segment.className = 'field';
      bar.append(segment);
    }
    const count = document.createElement('strong');
    count.textContent = matches.length;
    count.setAttribute('aria-label', `${matches.length} proposed cities, ${matches.filter((city) => city.pilot).length} field pilots`);
    row.append(label, bar, count);
    chart.append(row);
  }
}

Promise.all([load('data/cities.json'), load('data/nigeria.geojson')]).then(([cities, boundary]) => {
  drawBoundary(boundary);
  drawChart(cities);
  for (const name of zones) selector.add(new Option(name, name));
  const selected = new URLSearchParams(location.search).get('city');
  const firstCity = cities.find((city) => city.id === selected) ?? cities[0];
  let active = firstCity.id;
  const controls = new Map();

  function select(city) {
    active = city.id;
    for (const [id, pair] of controls) {
      for (const control of pair) control.setAttribute('aria-pressed', String(id === active));
    }
    fillCityPanel(city);
  }

  function drawCities() {
    controls.clear();
    svgHost.replaceChildren();
    cityList.replaceChildren();
    const visible = cities.filter((city) => !selector.value || city.zone === selector.value);
    for (const city of visible) {
      const [x, y] = xy(city.lon, city.lat);
      const [dx, dy] = city.label;
      const pin = svg('g', {class: city.pilot ? 'pin field' : 'pin', role: 'button', tabindex: 0, 'aria-label': city.name, transform: `translate(${x} ${y})`});
      const hit = svg('circle', {r: 17, fill: 'transparent'});
      const dot = svg('circle', {r: 6, class: 'marker'});
      const label = svg('text', {x: dx, y: dy, 'text-anchor': dx < 0 ? 'end' : 'start'});
      label.textContent = city.name;
      pin.append(hit, dot, label);
      pin.addEventListener('click', () => select(city));
      pin.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          select(city);
        }
      });
      svgHost.append(pin);
      const item = document.createElement('button');
      item.type = 'button';
      item.textContent = city.name;
      item.addEventListener('click', () => select(city));
      cityList.append(item);
      controls.set(city.id, [pin, item]);
    }
    select(visible.find((city) => city.id === active) ?? visible[0]);
  }

  selector.addEventListener('change', drawCities);
  drawCities();
}).catch(() => {
  panel.textContent = 'The city map could not load. You can still download the city roster from the Data section.';
});
