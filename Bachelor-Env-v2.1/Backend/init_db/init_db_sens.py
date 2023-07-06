import mysql.connector
import xml.etree.ElementTree as ET

def init_db_sens():
    # mysql connection
    mydb = mysql.connector.connect(
        host="mysqldb-sens",
        user="root",
        password="Password-123"
    )
    
    # rebuild the database
    cursor = mydb.cursor()
    cursor.execute("DROP DATABASE IF EXISTS customer")
    cursor.execute("CREATE DATABASE customer")
    cursor.close()
    
    # database connection
    mydb = mysql.connector.connect(
        host="mysqldb-sens",
        user="root",
        password="Password-123",
        database="customer"
    )
    
    # rebuild the table and instert the test process
    cursor = mydb.cursor()
    cursor.execute("DROP TABLE IF EXISTS xml")
    cursor.execute("CREATE TABLE xml (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, content LONGTEXT NOT NULL)")
    cursor.close()
    
    print('db-sens initalized')

def insert_to_db_sens(name: str, content: str):
    
    # database connection
    mydb = mysql.connector.connect(
        host="mysqldb-sens",
        user="root",
        password="Password-123",
        database="customer"
    )
    
    # instert the values
    cursor = mydb.cursor()
    sql = "INSERT INTO xml (name, content) VALUES (%s, %s)"
    name = name.lower()
    args = (name, content)
    cursor.execute(sql, args)
    mydb.commit()
    
    print(cursor.rowcount, "was inserted.")
    cursor.close()

    return f"{cursor.rowcount}, was inserted."

# reset the database   
init_db_sens()

# reading the xml files and commiting it to the database
f = open("/code/init_db/Test-Process-Release2815.xml", "r")
xml_string = f.read()
insert_to_db_sens('test process', xml_string)

f = open("/code/init_db/test.xml", "r")
xml_string = f.read()
insert_to_db_sens('test process 2', xml_string)

f = open("/code/init_db/rotete-prosess.xml", "r")
xml_string = f.read()
insert_to_db_sens('Rotete prosess', xml_string)

f = open("/code/init_db/object-with-image.xml", "r")
xml_string = f.read()
insert_to_db_sens('Object with image', xml_string)