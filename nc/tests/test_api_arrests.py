import pandas as pd

from django.test import TestCase

from nc.models import StopPurpose
from nc.views.arrests import sort_by_stop_purpose


class AgencyTests(TestCase):
    def test_sort_by_stop_purpose(self):
        """Sort DataFrame by stop_purpose column in order of the IntegerChoices"""
        df = pd.DataFrame(
            data={
                "stop_purpose": [
                    StopPurpose.CHECKPOINT,
                    StopPurpose.INVESTIGATION,
                    StopPurpose.SEAT_BELT_VIOLATION,
                    StopPurpose.OTHER_MOTOR_VEHICLE_VIOLATION,
                    StopPurpose.VEHICLE_REGULATORY_VIOLATION,
                    StopPurpose.VEHICLE_EQUIPMENT_VIOLATION,
                    StopPurpose.SAFE_MOVEMENT_VIOLATION,
                    StopPurpose.DRIVING_WHILE_IMPAIRED,
                    StopPurpose.STOP_LIGHT_SIGN_VIOLATION,
                    StopPurpose.SPEED_LIMIT_VIOLATION,
                ],
            }
        )
        self.assertEqual(sort_by_stop_purpose(df)["stop_purpose"].tolist(), StopPurpose.values)
