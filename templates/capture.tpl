<!DOCTYPE html>
<html>
<head>
</head>

<body style="padding:0;margin:0;text-align:center;overflow:hidden;" onresize="scaleFrame();" onload="scaleFrame();">

<iframe id="xframe_a" name="<!--name-->" src="<!--url-->" onload="" style="background:#fff;position:absolute;left:0;top:0;border:0;width:<!--w-->px;height:<!--h-->px;"></iframe>

<script>

var xFrameHeight = '<!--h-->';
var xFrameWidth = '<!--w-->';
var xFrameWidthMax = '<!--w-->';
var xFramescale = 1;
var xFrameSelected = 'b';

var scaleFrame = function(){

    var i;

    if(<!--noresize-->)
        return;

    var scaleDown = false;
    for(i=0;i<1000;i++)
        if(xFrameWidth > window.innerWidth || xFrameHeight > window.innerHeight)
        {
            xFramescale *= 0.999;
            xFrameWidth *= 0.999;
            xFrameHeight *= 0.999;
            scaleDown = true;
        }
        else
            break;

    if(!scaleDown)
        for(i=0;i<1000;i++)
            if(xFrameWidth < window.innerWidth && xFrameHeight < window.innerHeight)
            {
                xFramescale *= 1.001;
                xFrameWidth *= 1.001;
                xFrameHeight *= 1.001;
            }
            else
                break;

    document.getElementById('xframe_a').style.transform = 'scale('+xFramescale+')';
    document.getElementById('xframe_a').style.transformOrigin = '0 0';
};

scaleFrame();

</script>
</body>
</html>