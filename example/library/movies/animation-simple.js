/**
 * Animated attributes
 */
var rectPath = bonsai.Path.rect(150, 150, 150, 150).attr({fillColor: 'red',lineColor: 'green', lineWidth: 5,});

stage.addChild(rectPath);

rectPath.animate('1s', { x: 300 });
