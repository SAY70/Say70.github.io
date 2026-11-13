# Say70.github.io

Source for Suraj Yadav's personal portfolio site, served with GitHub Pages at https://say70.github.io.

## Structure

- `index.html` – main page
- `assets/css`, `assets/js`, `assets/img`, `assets/vendor` – styles, scripts, images and third-party libraries
- `assets/docs` – CV and certificates
- `QUICK_REFERENCE.md`, `VISUAL_ENHANCEMENTS.md` – notes on the site's visual design

## Google Scholar metrics

The `Update Google Scholar metrics` workflow (`.github/workflows/update-scholar-metrics.yml`) runs every Monday and can also be started by hand. It installs `requirements.txt`, runs `assets/js/update_scholar_metrics.py`, and commits the refreshed `radarplotdata.json` and `coauthor_data.json`.

## Local preview

```bash
python -m http.server 8000
```

Then open http://localhost:8000.
