# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('page_lock', '0001_initial'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='databasepagelockmodel',
            options={'ordering': ('locked_at',), 'verbose_name': 'Page Lock', 'verbose_name_plural': 'Page Locks'},
        ),
        migrations.AlterField(
            model_name='databasepagelockmodel',
            name='locked_at',
            field=models.DateTimeField(db_index=True),
        ),
        migrations.AlterField(
            model_name='databasepagelockmodel',
            name='locked_out',
            field=models.DateTimeField(db_index=True),
        ),
    ]
