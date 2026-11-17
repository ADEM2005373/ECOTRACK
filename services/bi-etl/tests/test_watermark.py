from datetime import datetime, timezone

from bson import ObjectId

from watermark import Watermark, build_incremental_filter, next_watermark

T1 = datetime(2026, 11, 10, 10, 0, tzinfo=timezone.utc)
T2 = datetime(2026, 11, 10, 11, 0, tzinfo=timezone.utc)
ID_A = ObjectId("672f10a8b9e1c2d3e4f5a601")
ID_B = ObjectId("672f10a8b9e1c2d3e4f5a602")


def doc(updated_at, _id):
    return {"_id": _id, "updatedAt": updated_at}


def test_first_run_filter_loads_everything_with_a_cursor_position():
    assert build_incremental_filter(None) == {
        "_id": {"$type": "objectId"},
        "updatedAt": {"$type": "date"},
    }


def test_incremental_filter_is_compound_cursor():
    query = build_incremental_filter(Watermark(T1, str(ID_A)))
    assert query["$or"] == [
        {"updatedAt": {"$gt": T1}},
        {"updatedAt": T1, "_id": {"$gt": ID_A}},
    ]


def test_next_watermark_is_max_updated_at_read_not_now():
    result = next_watermark([doc(T2, ID_A), doc(T1, ID_B)], None)
    assert result == Watermark(T2, str(ID_A))


def test_ties_on_updated_at_are_ordered_by_object_id():
    result = next_watermark([doc(T1, ID_B), doc(T1, ID_A)], None)
    assert result == Watermark(T1, str(ID_B))


def test_empty_batch_keeps_current_watermark():
    current = Watermark(T1, str(ID_A))
    assert next_watermark([], current) is current
    assert next_watermark([], None) is None


def test_watermark_never_moves_backwards():
    current = Watermark(T2, str(ID_B))
    assert next_watermark([doc(T1, ID_A)], current) == current


def test_naive_datetime_positions_are_utc():
    naive = datetime(2026, 11, 10, 10, 0)
    assert next_watermark([doc(naive, ID_A)], None) == Watermark(T1, str(ID_A))
