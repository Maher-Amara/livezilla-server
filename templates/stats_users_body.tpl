<br><br>
<table cellpadding="0" cellspacing="0" align="center" style="min-width:900px;">
	<tr>
		<td>
			<table cellspacing="0" cellpadding="0" width="100%">
				<tr>
					<td class="header_line"><!--lang_stats_visitors--></td>
					<td class="header_line" align="right"><!--header_span_overview--></td>
				</tr>
				<tr>
					<td class="header_nav_line">&nbsp;&nbsp;<!--amount--> <!--lang_stats_visitors--> (<em>unique</em>)</td>
					<td class="header_nav_line" align="right">Status:&nbsp;&nbsp;<!--status-->&nbsp;</td>
				</tr>
			</table>
		</td>
	</tr>
	<tr>
		<td>
			<table class="bt_values" cellspacing="0" cellpadding="2" width="100%">
				<tr>
					<td class="bt_column_header" width="60" align="center"><!--lang_stats_pages--></td>
					<td class="bt_column_header" width="80" align="center"><!--lang_stats_entrance--></td>
					<td class="bt_column_header" width="100" align="center"><!--lang_stats_exit--></td>
					<td class="bt_column_header" width="*"><!--lang_stats_country--></td>
					<td class="bt_column_header" width="*"><!--lang_stats_city--></td>
					<td class="bt_column_header" width="*"><!--lang_stats_system--></td>
					<td class="bt_column_header" width="25">&nbsp;</td>
				</tr>
				<!--visitors-->
			</table>
			<br>
		</td>
	</tr>
</table>
<script type="text/javascript">
function showInfoBox(_isp, _visits, _visits_day, _ip, _host, _id, _parent)
{
if(ibCurrent != _parent)
{
document.getElementById("info_box").innerHTML = "<strong>ID:</strong> " + _id + "<br><strong><!--lang_stats_isp-->:</strong> " + _isp + "<br><strong>IP:</strong> " +_ip + "<br><strong>Host:</strong> " +_host + "<br><strong><!--lang_stats_visits-->:</strong> " + _visits + "<br><strong><!--lang_stats_visits_today-->:</strong> " + _visits_day;
assignPosition(document.getElementById("info_box"));
document.getElementById("info_box").style.display = "block";
ibCurrent = _parent;
}
else
{
document.getElementById("info_box").style.display = "none";
ibCurrent = null;
}
}
</script>
