from __future__ import unicode_literals

from django.db import models
from django.utils.translation import ugettext_lazy as _
from django_extensions.db.fields.json import JSONField
from page_lock.models.base_model import BasePageLockModel
from page_lock.settings import (
    URL_IGNORE_PARAMETERS
)


class DatabasePageLockModel(BasePageLockModel, models.Model):
    """
    Parameters:
      + active       whether data is still active
      + locked       whether page is locked
      + locked_at    time when page was locked
      + locked_out   time when page will be unlocked
      + locked_by    user_reference of user that locked page
      + parameters   url parameters in JSON
      + url          url of locked page
    """
    url = models.URLField()
    url_parameters = models.CharField(max_length=1024, null=True, blank=True)
    active = models.BooleanField(default=True)
    user_reference = models.CharField(max_length=255, null=True, blank=True)
    locked = models.BooleanField(default=True)
    locked_at = models.DateTimeField(db_index=True)
    locked_out = models.DateTimeField(db_index=True)

    def __unicode__(self):
        return '{}'.format(self.pk)

    @classmethod
    def _get_query_kwargs(cls, page_settings):
        # TODO(vstefka) take into account also time.
        query_kwargs = {
            'active': True,
            'url': page_settings['page_url']
        }
        if not URL_IGNORE_PARAMETERS:
            query_kwargs['url_parameters'] = page_settings['page_url_parameters']  # noqa

        return query_kwargs

    @classmethod
    def deactivate(cls, page_settings):
        query_kwargs = cls._get_query_kwargs(page_settings)
        page_locks = cls.objects.filter(**query_kwargs)
        page_locks.delete()

    @classmethod
    def get_data(cls, page_settings):
        query_kwargs = cls._get_query_kwargs(page_settings)
        page_locks = cls.objects.filter(**query_kwargs)

        if not page_locks.exists():
            return None

        page_lock = page_locks.first()

        return {
            'locked_at': page_lock.locked_at,
            'locked_out': page_lock.locked_out,
            'user_reference': page_lock.user_reference
        }

    @classmethod
    def set_data(cls, page_settings, data):
        data['url'] = page_settings['page_url']
        if not URL_IGNORE_PARAMETERS:
            data['url_parameters'] = page_settings['page_url_parameters']

        try:
            cls.objects.create(**data)
        except cls.DoesNotExist:
            raise

    class Meta:
        ordering = ('locked_at',)
        app_label = 'page_lock'
        verbose_name = 'Page Lock'
        verbose_name_plural = 'Page Locks'