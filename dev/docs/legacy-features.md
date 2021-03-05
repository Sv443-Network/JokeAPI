[<< Home](./home.md#readme)
# Legacy / Deprecated Features

This document contains a list of all features that were a part of JokeAPI but have been deprecated or have entered the legacy status.  
| Status | Description |
| --- | --- |
| ⚡ `Legacy` | The feature is still usable, but either locked behind a setting or discouraged to use |
| ❌ `Deprecated` | The fetaure is no longer usable and has been completely removed or disabled |
| 🕸 `Disabled` | This feature was temporarily disabled for a certain (or unknown) period of time |

<br><br>

> ## Submission Endpoints accept PUT requests
> ### ⚡ `Legacy` since `v2.4.0`
> Submission endpoints like `/submit` and `/restart` used to only accept PUT requests.  
> This was left over from v2.0.0 because I didn't inform myself on what the different methods mean.  
> It was left in for backwards compatibility but will probably be completely removed in `v3`.  
>   
> This feature can be toggled in `settings.legacy.submissionEndpointsPutMethod`

<br>

> ## Analytics
> ### 🕸 `Disabled` since around `v2.2`
> The analytics module collects data about JokeAPI's usage.  
>   
> I didn't really know what to do with the analytics data I have collected.  
> That's why I disabled the fetaure until I find some tool that can visualize and make sense of the data.  
>   
> This feature can be toggled and configured in `settings.analytics.enabled`


<br><br><br><br>

[<< Home](./home.md#readme)
