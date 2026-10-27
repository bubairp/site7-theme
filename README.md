# Site7 Theme

The base theme of a Site7 site: every core template, layout, component and
block. Sites require it with Composer (`site7/theme`) and never edit it in
`vendor/`.

Craft looks for a template in this order, first match wins:

1. `designs/<active>/templates/`: the active design's own versions
2. `templates/`: the site's overrides, its own blocks and bought extra blocks
3. `vendor/site7/theme/templates/`: this package

Site7 Studio registers this package's `templates/` (the `extra.site7.templates`
path in composer.json) as a site template root.

To change a core template on one site, copy it from here to the same path in
the site's `templates/` and edit the copy.
