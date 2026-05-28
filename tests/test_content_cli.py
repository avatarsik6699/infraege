from pathlib import Path

from app.content import cli


async def _fake_import_content(content_root: Path) -> int:
    return 27


def test_content_check_cli_passes(capsys) -> None:
    exit_code = cli.main(["check", "--content-root", "content"])

    output = capsys.readouterr().out
    assert exit_code == 0
    assert "27 task files" in output


def test_content_check_cli_returns_one_on_validation_error(tmp_path: Path, capsys) -> None:
    (tmp_path / "tasks").mkdir()
    (tmp_path / "assets").mkdir()

    exit_code = cli.main(["check", "--content-root", str(tmp_path)])

    output = capsys.readouterr().out
    assert exit_code == 1
    assert "ege-01.md:$: task file is missing" in output


def test_content_import_cli_reports_success(monkeypatch, capsys) -> None:
    monkeypatch.setattr(cli, "import_content", _fake_import_content)

    exit_code = cli.main(["import", "--content-root", "content"])

    output = capsys.readouterr().out
    assert exit_code == 0
    assert "27 tasks upserted" in output
