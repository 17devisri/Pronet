#!/bin/bash
python manage.py migrate --no-input
python manage.py seed_data
python manage.py collectstatic --no-input
gunicorn --bind=0.0.0.0 --timeout 600 pronet_project.wsgi
