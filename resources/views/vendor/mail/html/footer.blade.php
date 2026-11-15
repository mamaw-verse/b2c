<tr>
<td>
<table class="footer" align="center" width="570" cellpadding="0" cellspacing="0" role="presentation">
<tr>
<td class="content-cell" align="center">
<p style="margin: 0 0 12px;">
<a href="{{ config('app.url') }}" style="display: inline-block;">
<img src="{{ asset('images/brand/icon.png') }}" alt="{{ config('app.name') }}" height="32" style="height: 32px; width: auto;">
</a>
</p>
{{ Illuminate\Mail\Markdown::parse($slot) }}
</td>
</tr>
</table>
</td>
</tr>
