const width = 1000;
const barWidth = 500;
const height = 500;
const margin = 30;

const yearLable = d3.select('#year');
const countryName = d3.select('#country-name');

const barChart = d3.select('#bar-chart')
            .attr('width', barWidth)
            .attr('height', height);

const scatterPlot  = d3.select('#scatter-plot')
            .attr('width', width)
            .attr('height', height);

const lineChart = d3.select('#line-chart')
            .attr('width', width)
            .attr('height', height);

let xParam = 'fertility-rate';
let yParam = 'child-mortality';
let rParam = 'gdp';
let year = '2000';
let param = 'child-mortality';
let lineParam = 'gdp';
let highlighted = '';
let selected;

const x = d3.scaleLinear().range([margin*2, width-margin]);
const y = d3.scaleLinear().range([height-margin, margin]);

const xBar = d3.scaleBand().range([margin*2, barWidth-margin]).padding(0.1);
const yBar = d3.scaleLinear().range([height-margin, margin])

const xAxis = scatterPlot.append('g').attr('transform', `translate(0, ${height-margin})`);
const yAxis = scatterPlot.append('g').attr('transform', `translate(${margin*2}, 0)`);

const xLineAxis = lineChart.append('g').attr('transform', `translate(0, ${height-margin})`);
const yLineAxis = lineChart.append('g').attr('transform', `translate(${margin*2}, 0)`);

const xBarAxis = barChart.append('g').attr('transform', `translate(0, ${height-margin})`);
const yBarAxis = barChart.append('g').attr('transform', `translate(${margin*2}, 0)`);

const colorScale = d3.scaleOrdinal().range(['#DD4949', '#39CDA1', '#FD710C', '#A14BE5']);
const radiusScale = d3.scaleSqrt().range([10, 30]);

loadData().then(data => {

    colorScale.domain(d3.set(data.map(d=>d.region)).values());

    d3.select('#range').on('change', function(){
        year = d3.select(this).property('value');
        yearLable.html(year);
        updateScattePlot();
        updateBar();
    });

    d3.select('#radius').on('change', function(){
        rParam = d3.select(this).property('value');
        updateScattePlot();
    });

    d3.select('#x').on('change', function(){
        xParam = d3.select(this).property('value');
        updateScattePlot();
    });

    d3.select('#y').on('change', function(){
        yParam = d3.select(this).property('value');
        updateScattePlot();
    });

    d3.select('#param').on('change', function(){
        param = d3.select(this).property('value');
        updateBar();
    })

    function updateBar() {
        let RegionKeys = d3.map(data, function (d) {
            return d['region'];
        }).keys();

        let RegionMean = RegionKeys.map(
            function (reg){
                return (
                    d3.mean(data.filter(function (d){return d['region'] == reg})
                                .flatMap(function (d){return d[param][year]})
                    )
                )
            }
        );

        let MeanForRegion = [];
        RegionKeys.forEach((key, i) => {
            let temp = {"region": key, "mean": RegionMean[i]};
            MeanForRegion.push(temp);
        });

        // console.log(param)
        // console.log(RegionKeys);
        // console.log(RegionMean);
        // console.log(MeanForRegion);
        // console.log(d3.max(RegionMean))

        xBar.domain(RegionKeys);
        xBarAxis.call(d3.axisBottom(xBar));

        yBar.domain([0, d3.max(RegionMean)]);;
        yBarAxis.call(d3.axisLeft(yBar));

        barChart.selectAll('rect').remove();

        barChart.selectAll('rect')
            .data(MeanForRegion)
            .enter()
            .append('rect')
            .attr('width', xBar.bandwidth())
            .attr('height', function (d) {
                return height - yBar(d['mean']);
            })
            .attr('x', function (d){
                return (xBar(d['region']));
            })
            .attr('y', function (d){
                return yBar(d['mean']) - margin;
            })
            .attr('fill', function (d){
                return colorScale(d['region'])
            });

        d3.selectAll('rect').on('click', function (active){
            if (highlighted != this) {
                barChart.selectAll('rect').style('opacity', 0.1);
                d3.select(this).style('opacity', 1);
                scatterPlot.selectAll('circle').style('opacity', 0);
                scatterPlot.selectAll('circle').filter(d => d['region'] == active.region)
                    .style('opacity', 0.9)
                highlighted = this;
            } else {
                barChart.selectAll('rect').style('opacity', 1)
                scatterPlot.selectAll('circle').style('opacity', 0.75)
                highlighted = null;
            }
        })

        return;
    }

    function updateScattePlot() {
        let xRange = data.map(function (d) {return +d[xParam][year]});
        let yRange = data.map(function (d) {return +d[yParam][year]});
        let rRange = data.map(function (d) {return +d[rParam][year]});

        x.domain([d3.min(xRange), d3.max(xRange)]);
        y.domain([d3.min(yRange), d3.max(yRange)]);
        radiusScale.domain([d3.min(rRange), d3.max(rRange)]);

        xAxis.call(d3.axisBottom(x));
        yAxis.call(d3.axisLeft(y));

        scatterPlot.selectAll('circle').remove();

        scatterPlot.selectAll('circle')
            .data(data)
            .enter()
            .append('circle')
            .attr('cx', function (d) {
                return x(d[xParam][year])
            })
            .attr('cy', function (d) {
                return y(d[yParam][year])
            })
            .attr('r', function (d) {
                return radiusScale(d[rParam][year])
            })
            .attr('fill', function (d) {
                return colorScale(d['region'])
            })
            .attr('opacity', 0.75)

        scatterPlot.selectAll('circle').on('click', function (active){
            scatterPlot.selectAll('circle').attr('stroke-width', 'default').style('opacity', 0.35)
            d3.select(this).attr('stroke-width', 3).style('opacity', 1.0);
            selected = active['country']
            updateLinearPlot();
        })

        return;
    }

    function updateLinearPlot() {
        if (selected != null) {
            let ValueData = data.filter(function (d){return d['country'] == selected})
                                  .map(function (d){return d[lineParam]})[0];

            let CountryData = [];
            for (let year = 1800; year < 2021; year++) {
                CountryData.push({'year': year, 'value': +ValueData[year]})
            }

            // console.log(ValueData)
            // console.log(CountryData)

            CountryData.splice(211, 5);

            let xRange = d3.range(1800, 2021);
            let yRange = d3.values(ValueData).map(function (d){return +d});

            x.domain([d3.min(xRange), d3.max(xRange)])
            y.domain([d3.min(yRange), d3.max(yRange)])

            xLineAxis.call(d3.axisBottom(x))
            yLineAxis.call(d3.axisLeft(y))

            lineChart.append('path')
                     .attr('class', 'line')
                     .datum(CountryData)
                     .enter()
                     .append('path');

            lineChart.selectAll('.line')
                .datum(CountryData)
                .attr("stroke", "black")
                .attr("stroke-width", 2)
                .attr("fill", "none")
                .attr("d", d3.line()
                    .x(d => x(+d.year))
                    .y(d => y(+d.value))
                );

        }
    }

    updateBar();
    updateScattePlot();
    updateLinearPlot();
});


async function loadData() {
    const data = {
        'population': await d3.csv('data/population.csv'),
        'gdp': await d3.csv('data/gdp.csv'),
        'child-mortality': await d3.csv('data/cmu5.csv'),
        'life-expectancy': await d3.csv('data/life_expectancy.csv'),
        'fertility-rate': await d3.csv('data/fertility-rate.csv')
    };

    return data.population.map(d => {
        const index = data.gdp.findIndex(item => item.geo == d.geo);
        return  {
            country: d.country,
            geo: d.geo,
            region: d.region,
            population: d,
            'gdp': data['gdp'][index],
            'child-mortality': data['child-mortality'][index],
            'life-expectancy': data['life-expectancy'][index],
            'fertility-rate': data['fertility-rate'][index]
        }
    })
}