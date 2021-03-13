from rest_framework import serializers
from squares.models import Product


class ProductSerializer(serializers.ModelSerializer):
    start = serializers.SerializerMethodField()
    duration = serializers.CharField(source='get_duration_display')
    end = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['square_id', 'price', 'start',
                  'duration', 'end', 'listing', ]

    def format_datetime(self, datetime):
        return datetime.strftime('%d %b %y')

    def get_start(self, obj):
        return self.format_datetime(obj.start)

    def get_end(self, obj):
        return self.format_datetime(obj.end)