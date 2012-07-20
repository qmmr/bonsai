var button = new bonsai.Group().addTo(stage);

button.bg = bonsai.Path.rect(50, 50, 100, 40, 5).attr({
	fillGradient: bonsai.gradient.radial(['#19D600', '#0F8000'], 100, 50, -20),
	lineColor: '#CCC',
	lineWidth: 0
}).addTo(button);

button
	.on('mouseover', function() {
		button.bg.animate('.2s', {
			fillGradient: bonsai.gradient.radial(['#9CFF8F', '#0F8000'], 100, 50, -20),
			lineWidth: 3
		})
	})
	.on('mouseout', function() {
		button.bg.animate('.2s', {
			fillGradient: bonsai.gradient.radial(['#19D600', '#0F8000'], 100, 50, -20),
			lineWidth: 0
		})
	})
	.on('click', function() {
		alert('Thanks for clicking me.');
	})

button.text = new bonsai.Text('Button').attr({
  x: 70,
  y: 63,
  fontFamily: 'Arial',
  fontSize: '20px',
  textFillColor: 'white',
  filters: ['blur', filter.dropShadow(1,1,1,255)]
}).addTo(button);
